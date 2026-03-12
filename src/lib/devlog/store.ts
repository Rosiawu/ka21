import fs from 'fs/promises';
import path from 'path';
import { fetchJsonFileFromGitHub, updateGitHubJsonFile } from '@/lib/github';
import type { DevLogEntry } from '@/data/devLogs';
import toolsData from '@/data/tools.json';

type DevLogSubmissionFile = {
  entries: DevLogEntry[];
  meta: {
    version: string;
    updatedAt: string;
    count: number;
  };
};

const SUBMISSIONS_PATH = path.join(process.cwd(), 'src', 'data', 'devlog-submissions.json');
const SUBMISSIONS_GITHUB_PATH = 'src/data/devlog-submissions.json';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOOL_RECORDS = ((toolsData as { tools?: Array<{ id: string; name: string; url?: string; description?: string; tags?: string[] }> }).tools || []).filter(
  (tool) => tool && tool.id && tool.url
);
const TOOL_ALIAS_MAP: Record<string, string[]> = {
  gofullpage: [
    'fdpohaocaechififmbbbbbknoalclacl',
    'gofullpage-full-page-scre',
    'gofullpage',
    'chromewebstore.google.com/detail/gofullpage',
  ],
  bmmd: [
    'bm.md',
    'bmmd',
  ],
  artifig: [
    '1434961364530492108',
    'artifig-ai-turn-ideas-into-live-figma-plugins',
    'figma.com/community/plugin/1434961364530492108',
  ],
  'remove-bg': [
    'remove.bg',
    'removebg',
  ],
  cursor: [
    'cursor.com',
    'cursor.sh',
    'cursor',
  ],
  codex: [
    'chatgpt.com',
    'openai codex',
    'codex',
  ],
  'gemini-voyager': [
    'gemini voyager',
    'gemini-voyager',
    'chromewebstore.google.com',
  ],
};

function isGitHubBackedStore() {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO);
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function toAsciiSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return normalized || `devlog-${Date.now().toString(36)}`;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('invalid-image-data-url');
  }
  const mimeType = match[1];
  const base64 = match[2];
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  return { mimeType, base64, ext };
}

async function readLocalStore() {
  const raw = await fs.readFile(SUBMISSIONS_PATH, 'utf-8');
  return JSON.parse(raw) as DevLogSubmissionFile;
}

async function writeLocalStore(data: DevLogSubmissionFile) {
  await fs.writeFile(SUBMISSIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function readStore(): Promise<{ data: DevLogSubmissionFile; sha?: string }> {
  if (isGitHubBackedStore()) {
    const result = await fetchJsonFileFromGitHub<DevLogSubmissionFile>(SUBMISSIONS_GITHUB_PATH);
    return { data: result.content, sha: result.sha };
  }
  return { data: await readLocalStore() };
}

async function writeStore(data: DevLogSubmissionFile, message: string, sha?: string) {
  data.meta.updatedAt = nowIso();
  data.meta.count = data.entries.length;
  if (isGitHubBackedStore()) {
    if (!sha) throw new Error('missing-sha');
    await updateGitHubJsonFile(SUBMISSIONS_GITHUB_PATH, sha, data, message);
    return;
  }
  await writeLocalStore(data);
}

async function uploadImageToGitHub(filePath: string, base64: string, message: string) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env variables');
  }

  const encodedPath = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodedPath}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: base64,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(err?.message || `GitHub image upload error: ${res.status}`);
  }
}

async function uploadImageLocally(relativeFilePath: string, base64: string) {
  const absolutePath = path.join(PUBLIC_DIR, relativeFilePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(base64, 'base64'));
}

async function persistImages(images: string[], entryId: string, title: string) {
  const imageDir = `images/devlog/submissions/${entryId}`;
  const safeTitleSlug = toAsciiSlug(title);
  return Promise.all(
    images.slice(0, 9).map(async (image, index) => {
      const { base64, ext } = parseDataUrl(image);
      const fileName = `${String(index + 1).padStart(2, '0')}-${safeTitleSlug}.${ext}`;
      const relativeFilePath = `${imageDir}/${fileName}`;
      if (isGitHubBackedStore()) {
        await uploadImageToGitHub(`public/${relativeFilePath}`, base64, `feat(devlog): upload image for ${entryId}`);
      } else {
        await uploadImageLocally(relativeFilePath, base64);
      }
      return `/${relativeFilePath}`;
    })
  );
}

function buildVersion(entryCount: number) {
  return `共创 ${String(entryCount).padStart(2, '0')}`;
}

function parseVersionNumber(version: string) {
  const match = version.match(/(\d+)/);
  return match ? Number(match[1]) || 0 : 0;
}

function buildNextVersion(entries: DevLogEntry[]) {
  const maxVersion = entries.reduce((max, item) => Math.max(max, parseVersionNumber(item.version)), 0);
  return buildVersion(maxVersion + 1);
}

function buildBody(body: string, author: string) {
  const intro = `今天补一条手机直发的开发日志。`;
  const withIntro = body.startsWith(intro) ? body : `${intro}\n\n${body}`;
  return author ? `${withIntro}\n\n记录人：${author}` : withIntro;
}

function buildImageSlotLabel(title: string, count: number) {
  if (count <= 0) {
    return {
      zh: `手机提交开发日志图片位：${title}（待补图）`,
      en: `Mobile devlog image slot: ${title} (pending upload)`,
    };
  }
  return {
    zh: `手机提交开发日志配图：${title}（${count}张）`,
    en: `Mobile devlog images: ${title} (${count})`,
  };
}

function extractUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s)]+/g);
  return Array.from(new Set((matches || []).map((item) => item.replace(/[.,，。!！]+$/, '')))).slice(0, 6);
}

function normalizeComparableUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    return `${url.hostname}${pathname}`;
  } catch {
    return rawUrl.trim();
  }
}

function normalizeHost(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function normalizePath(rawUrl: string) {
  try {
    return new URL(rawUrl).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  );
}

function buildToolMatchers(tool: (typeof TOOL_RECORDS)[number]) {
  const host = normalizeHost(tool.url || '');
  const path = normalizePath(tool.url || '');
  const tokens = tokenize([tool.id, tool.name, tool.description || '', ...(tool.tags || [])].join(' '));
  return {
    ...tool,
    host,
    path,
    tokens,
  };
}

const TOOL_MATCHERS = TOOL_RECORDS.map(buildToolMatchers);

function scoreToolMatch(url: string, tool: (typeof TOOL_MATCHERS)[number]) {
  const inputHost = normalizeHost(url);
  const inputPath = normalizePath(url);
  const comparable = normalizeComparableUrl(url).toLowerCase();
  const toolComparable = normalizeComparableUrl(tool.url || '').toLowerCase();
  const urlTokens = tokenize(`${inputHost} ${inputPath}`);
  const raw = `${url} ${comparable} ${inputHost} ${inputPath}`.toLowerCase();
  let score = 0;

  if (!inputHost || !tool.host) return 0;
  if (comparable === toolComparable) score += 120;
  if (inputHost === tool.host) score += 60;
  if (inputHost.endsWith(tool.host) || tool.host.endsWith(inputHost)) score += 30;
  if (tool.path && inputPath && (inputPath.includes(tool.path) || tool.path.includes(inputPath))) score += 35;

  for (const token of tool.tokens) {
    if (urlTokens.includes(token)) {
      score += token.length >= 6 ? 18 : 10;
    } else if (inputPath.includes(token)) {
      score += token.length >= 6 ? 12 : 6;
    }
  }

  if (tool.id && inputPath.includes(tool.id.toLowerCase())) score += 24;
  if (tool.name && inputPath.includes(tool.name.toLowerCase().replace(/\s+/g, ''))) score += 24;

  const aliases = TOOL_ALIAS_MAP[tool.id] || [];
  for (const alias of aliases) {
    const normalizedAlias = alias.toLowerCase();
    if (raw.includes(normalizedAlias)) {
      score += normalizedAlias.length >= 10 ? 80 : 40;
    }
  }
  return score;
}

function resolveRelatedLinks(text: string): DevLogEntry['relatedLinks'] {
  const urls = extractUrls(text);
  if (!urls.length) return [];

  return urls.map((url) => {
    const matchedTool = TOOL_MATCHERS
      .map((tool) => ({ tool, score: scoreToolMatch(url, tool) }))
      .sort((a, b) => b.score - a.score)[0];

    if (matchedTool && matchedTool.score >= 60) {
      return {
        label: {
          zh: `小工具：${matchedTool.tool.name}`,
          en: `Tool: ${matchedTool.tool.name}`,
        },
        href: `/tools/${matchedTool.tool.id}`,
      };
    }

    return {
      label: {
        zh: `相关链接：${url}`,
        en: `Related link: ${url}`,
      },
      href: url,
    };
  });
}

export async function submitDevLog(input: {
  title: string;
  body: string;
  author?: string;
  images?: string[];
}) {
  const title = input.title.trim().slice(0, 60);
  const body = input.body.trim().slice(0, 6000);
  const author = (input.author || '').trim().slice(0, 20);

  if (!title) throw new Error('missing-title');
  if (!body) throw new Error('missing-body');

  const { data, sha } = await readStore();
  const date = new Date().toISOString().slice(0, 10);
  const entryId = `${toAsciiSlug(title)}-${Date.now()}`;
  const imagePaths = await persistImages(input.images || [], entryId, title);
  const bodyWithAuthor = buildBody(body, author);

  const entry: DevLogEntry = {
    id: entryId,
    version: buildNextVersion(data.entries),
    date,
    timelineTitle: { zh: title, en: title },
    cardTitle: { zh: title, en: title },
    body: { zh: bodyWithAuthor, en: bodyWithAuthor },
    imageSlotLabel: buildImageSlotLabel(title, imagePaths.length),
    relatedLinks: resolveRelatedLinks(body),
    images: imagePaths.map((src, index) => ({
      src,
      alt: {
        zh: `${title} 过程截图 ${index + 1}`,
        en: `${title} progress image ${index + 1}`,
      },
    })),
  };

  data.entries.unshift(entry);
  await writeStore(data, `feat(devlog): submit ${entryId}`, sha);
  return entry;
}
