const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const TABLE_JSON_PATH = path.join('/tmp', 'feishu-table-decoded.json');
const OUTPUT_JSON_PATH = path.join('/tmp', 'feishu-about-submissions.json');
const TEAM_IMAGE_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'team');

const FIELD_IDS = {
  seq: 'flddcDkOhN',
  name: 'fldk8tDzsU',
  title: 'fld2EIsdYA',
  location: 'fldRFmnV5O',
  mbti: 'fldtyOjwnt',
  intro: 'fldCrB9PQp',
  wechat: 'fldtYNMZNs',
  qr: 'fldCGFcQUi',
  avatar: 'fldv1tKOo6',
  keywords: 'flduWuNr3r',
  aiTools: 'fldLjGpJWE',
  posterLine: 'fldqJqP2Q4',
  consent: 'fld8jc91Bd',
};

const NAME_TO_ID = {
  倒放: 'daofang',
  计育韬: 'jiyutao',
  白苏Elliot: 'baisuelliot',
  何先森Kevin: 'hexiansenkevin',
  洛小山: 'luoxiaoshan',
  酸梅煮酒: 'suanmeizhujiu',
  TATALAB: 'tatalab',
  黄啊码: 'huangama',
  云天AI探索: 'yuntian',
  兔会计Scott: 'tuhuijiscott',
  比尔尝百草: 'bierchangbaicao',
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function runAppleScript(lines) {
  const result = spawnSync('osascript', lines.flatMap((line) => ['-e', line]), {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim() || 'AppleScript execution failed';
    fail(details);
  }

  return result.stdout.trim();
}

function chromeEval(jsCode) {
  const encoded = Buffer.from(jsCode, 'utf8').toString('base64');
  const wrapped = `eval(atob("${encoded}"))`;

  return runAppleScript([
    'with timeout of 600 seconds',
    'tell application "Google Chrome"',
    `return execute active tab of front window javascript "${wrapped.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
    'end tell',
    'end timeout',
  ]);
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${filePath}`);
  }
}

function getPlainText(cell) {
  if (!cell || cell.value == null) {
    return '';
  }

  const value = cell.value;

  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => item.text || item.link || item.name || item.number || item.sequence || '')
      .join('')
      .trim();
  }

  if (value && Array.isArray(value.users)) {
    return value.users.map((user) => user.name).join(', ').trim();
  }

  return '';
}

function splitList(value) {
  return value
    .replace(/\r/g, '\n')
    .split(/[\n,，、|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDescription(value) {
  return value
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function getConsentMap(fieldMap) {
  const options = fieldMap[FIELD_IDS.consent]?.property?.options || [];
  return Object.fromEntries(options.map((option) => [option.id, option.name]));
}

function inferExtension(file) {
  const extFromName = path.extname(file.name || '').toLowerCase();
  if (extFromName) {
    return extFromName;
  }

  if (file.mimeType === 'image/png') {
    return '.png';
  }

  if (file.mimeType === 'image/webp') {
    return '.webp';
  }

  return '.jpg';
}

function startUploadServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      const url = new URL(req.url, 'http://127.0.0.1');
      const relativePath = url.searchParams.get('path');

      if (!relativePath) {
        res.writeHead(400, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Missing path' }));
        return;
      }

      const targetPath = path.resolve(PROJECT_ROOT, relativePath);
      const teamDirPrefix = path.resolve(TEAM_IMAGE_DIR) + path.sep;
      if (!targetPath.startsWith(teamDirPrefix)) {
        res.writeHead(400, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Refusing to write outside team image dir' }));
        return;
      }

      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (!body.base64) {
            throw new Error('Missing base64 payload');
          }

          fs.writeFileSync(targetPath, Buffer.from(body.base64, 'base64'));
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          res.writeHead(400, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to determine upload server port'));
        return;
      }

      resolve({
        server,
        port: address.port,
      });
    });
  });
}

function writeAttachmentViaChrome(attachmentToken, relativeTargetPath, port) {
  const jsCode = `
    (() => {
      try {
        const download = new XMLHttpRequest();
        download.open('GET', '/space/api/box/stream/download/all/${attachmentToken}/', false);
        download.overrideMimeType('text/plain; charset=x-user-defined');
        download.send(null);

        if (download.status < 200 || download.status >= 300) {
          return JSON.stringify({
            __error: 'Download HTTP ' + download.status
          });
        }

        const source = download.responseText || '';
        const chunkSize = 0x8000;
        let binary = '';

        for (let i = 0; i < source.length; i += chunkSize) {
          const slice = source.slice(i, i + chunkSize);
          const chunk = [];
          for (let j = 0; j < slice.length; j += 1) {
            chunk.push(slice.charCodeAt(j) & 0xff);
          }
          binary += String.fromCharCode.apply(null, chunk);
        }

        const upload = new XMLHttpRequest();
        upload.open('POST', 'http://127.0.0.1:${port}/write?path=' + encodeURIComponent(${JSON.stringify(relativeTargetPath)}), false);
        upload.setRequestHeader('Content-Type', 'application/json');
        upload.send(JSON.stringify({ base64: btoa(binary) }));

        if (upload.status < 200 || upload.status >= 300) {
          return JSON.stringify({
            __error: 'Upload HTTP ' + upload.status + ': ' + (upload.responseText || '')
          });
        }

        return upload.responseText || '{"ok":true}';
      } catch (error) {
        return JSON.stringify({
          __error: String(error && error.message ? error.message : error)
        });
      }
    })();
  `;

  const output = chromeEval(jsCode);
  if (!output) {
    fail(`Empty attachment response for token: ${attachmentToken}`);
  }

  const parsed = JSON.parse(output);
  if (parsed.__error) {
    fail(`Attachment download failed for token ${attachmentToken}: ${parsed.__error}`);
  }
}

async function main() {
  ensureFileExists(TABLE_JSON_PATH);
  fs.mkdirSync(TEAM_IMAGE_DIR, { recursive: true });

  const tableData = JSON.parse(fs.readFileSync(TABLE_JSON_PATH, 'utf8'));
  const consentMap = getConsentMap(tableData.fieldMap);
  const records = Object.entries(tableData.recordMap || {});

  const normalized = records
    .map(([recordId, record]) => {
      const name = getPlainText(record[FIELD_IDS.name]);
      const id = NAME_TO_ID[name];

      if (!id) {
        fail(`Missing id mapping for name: ${name}`);
      }

      const consent = consentMap[record[FIELD_IDS.consent]?.value] || '';
      const avatarFile = record[FIELD_IDS.avatar]?.value?.[0] || null;
      const qrFile = record[FIELD_IDS.qr]?.value?.[0] || null;

      const avatarRelativePath = avatarFile
        ? `/images/team/avatar-${id}${inferExtension(avatarFile)}`
        : '';
      const qrRelativePath = qrFile
        ? `/images/team/qr-${id}${inferExtension(qrFile)}`
        : '';

      return {
        recordId,
        seq: Number(getPlainText(record[FIELD_IDS.seq])),
        id,
        name,
        title: getPlainText(record[FIELD_IDS.title]),
        location: getPlainText(record[FIELD_IDS.location]),
        mbti: getPlainText(record[FIELD_IDS.mbti]),
        specialty: splitList(getPlainText(record[FIELD_IDS.keywords])).join(','),
        wechatAccount: getPlainText(record[FIELD_IDS.wechat]),
        description: normalizeDescription(getPlainText(record[FIELD_IDS.intro])),
        aiTools: splitList(getPlainText(record[FIELD_IDS.aiTools])),
        posterLine: getPlainText(record[FIELD_IDS.posterLine]),
        consent,
        avatar: avatarRelativePath,
        wechatQR: qrRelativePath,
        avatarFile,
        qrFile,
      };
    })
    .filter((item) => item.consent === '同意' || item.consent === '仅网站可用')
    .sort((a, b) => a.seq - b.seq);

  const { server, port } = await startUploadServer();
  try {
    for (const item of normalized) {
      if (item.avatarFile) {
        const avatarRelativePath = path.join('public', item.avatar.slice(1));
        const avatarTarget = path.join(PROJECT_ROOT, avatarRelativePath);
        if (!fs.existsSync(avatarTarget)) {
          console.log(`Downloading avatar for ${item.name} -> ${avatarRelativePath}`);
          writeAttachmentViaChrome(item.avatarFile.attachmentToken, avatarRelativePath, port);
        }
      }

      if (item.qrFile) {
        const qrRelativePath = path.join('public', item.wechatQR.slice(1));
        const qrTarget = path.join(PROJECT_ROOT, qrRelativePath);
        if (!fs.existsSync(qrTarget)) {
          console.log(`Downloading QR for ${item.name} -> ${qrRelativePath}`);
          writeAttachmentViaChrome(item.qrFile.attachmentToken, qrRelativePath, port);
        }
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(normalized, null, 2));
  console.log(`Saved ${OUTPUT_JSON_PATH}`);
  console.log(`Exported ${normalized.length} approved submissions`);
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
