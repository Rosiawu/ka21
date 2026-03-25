import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { teamMembers } from '../src/data/team-members';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const outputDir = path.join(publicDir, 'posters');
const outputBase = 'dengxiabai-ai-friends-poster';

const width = 1600;
const height = 2280;
const cols = 4;
const cardWidth = 352;
const cardHeight = 432;
const gapX = 24;
const gapY = 24;
const marginX = 60;
const cardsTop = 332;

type MemberCard = {
  id: string;
  name: string;
  title: string;
  location?: string;
  specialty?: string;
  description?: string;
  wechatAccount?: string;
  avatarUri: string;
  qrUri: string;
};

const posterOverrides: Record<string, { description?: string; wechatAccount?: string }> = {
  wuman: {
    description: '评测过200多种AI工具的英语教学实战派',
  },
  xiaojinyu: {
    description: '深耕AI动画短剧生成的全栈设计师',
  },
  washu: {
    description: '把政企宣传视频流程AI化的直播技术负责人',
  },
  fenglaoshi: {
    wechatAccount: '风言风语的AI作业本',
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolvePublicAsset(assetPath: string): string {
  return assetPath.startsWith('/')
    ? path.join(publicDir, assetPath.slice(1))
    : path.resolve(projectRoot, assetPath);
}

function mimeTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  throw new Error(`Unsupported asset type: ${filePath}`);
}

async function fileToDataUri(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  if (path.extname(filePath).toLowerCase() === '.svg') {
    return `data:${mimeTypeFor(filePath)};base64,${buffer.toString('base64')}`;
  }

  const metadata = await sharp(buffer).metadata();
  const format = metadata.format;
  const mimeType =
    format === 'jpeg' ? 'image/jpeg'
      : format === 'png' ? 'image/png'
        : format === 'webp' ? 'image/webp'
          : mimeTypeFor(filePath);

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function publicAssetToDataUri(assetPath: string): Promise<string> {
  return fileToDataUri(resolvePublicAsset(assetPath));
}

async function resolveAvatarAsset(memberId: string, assetPath: string): Promise<string> {
  const jpgCandidate = path.join(projectRoot, 'miniprogram', 'assets', 'team-jpg', `avatar-${memberId.toLowerCase()}.jpg`);
  try {
    await fs.access(jpgCandidate);
    return jpgCandidate;
  } catch {
    return resolvePublicAsset(assetPath);
  }
}

function cleanText(value?: string): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function firstSentence(value?: string): string {
  const normalized = (value ?? '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';
  const [firstChunk = ''] = normalized.split(/[\n。！？!?；;]+/);
  return firstChunk.trim().replace(/[。！？!?；;，、,.]+$/u, '');
}

function measureChar(char: string): number {
  if (/\s/.test(char)) return 0.38;
  if (/[A-Za-z0-9]/.test(char)) return 0.58;
  if (/[·:：/&\-.()]/.test(char)) return 0.38;
  return 1;
}

function measureTextUnits(text: string): number {
  return [...text].reduce((total, char) => total + measureChar(char), 0);
}

function splitByUnits(text: string, maxUnits: number): [string, string] {
  let units = 0;
  let index = 0;

  for (; index < text.length; index += 1) {
    const char = text[index];
    const nextUnits = units + measureChar(char);
    if (index > 0 && nextUnits > maxUnits) {
      break;
    }
    units = nextUnits;
  }

  return [text.slice(0, index), text.slice(index)];
}

function wrapText(text: string, maxUnits: number, maxLines: number): string[] {
  const content = cleanText(text);
  if (!content) return [];

  const lines: string[] = [];
  let remaining = content;

  for (let lineIndex = 0; lineIndex < maxLines && remaining; lineIndex += 1) {
    const [chunk, rest] = splitByUnits(remaining, maxUnits);
    if (!chunk) break;

    if (lineIndex === maxLines - 1 && rest) {
      let trimmed = chunk;
      while (trimmed.length > 1 && measureTextUnits(`${trimmed}…`) > maxUnits) {
        trimmed = trimmed.slice(0, -1);
      }
      lines.push(`${trimmed.replace(/[，、；：,. ]+$/u, '')}…`);
      return lines;
    }

    lines.push(chunk);
    remaining = rest;
  }

  return lines;
}

function renderLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  options: {
    size: number;
    fill: string;
    weight?: number;
    anchor?: 'start' | 'middle' | 'end';
    family?: string;
  },
): string {
  const family = options.family ?? "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
  return lines
    .map((line, index) => {
      const yy = y + index * lineHeight;
      return `<text x="${x}" y="${yy}" text-anchor="${options.anchor ?? 'start'}" font-family="${family}" font-size="${options.size}" font-weight="${options.weight ?? 500}" fill="${options.fill}">${escapeXml(line)}</text>`;
    })
    .join('');
}

function buildClipDefs(members: MemberCard[]): string {
  return members
    .map((member, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = marginX + col * (cardWidth + gapX);
      const y = cardsTop + row * (cardHeight + gapY);
      return `
        <clipPath id="avatar-${member.id}" clipPathUnits="userSpaceOnUse">
          <circle cx="${x + 70}" cy="${y + 70}" r="42" />
        </clipPath>
      `;
    })
    .join('');
}

function cardPosition(index: number) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: marginX + col * (cardWidth + gapX),
    y: cardsTop + row * (cardHeight + gapY),
  };
}

function qrBlock(member: MemberCard, x: number, y: number): string {
  if (member.qrUri) {
    return `
      <rect x="${x}" y="${y}" width="118" height="118" rx="18" fill="#ffffff" />
      <image href="${member.qrUri}" x="${x + 8}" y="${y + 8}" width="102" height="102" preserveAspectRatio="xMidYMid meet" />
    `;
  }

  return `
    <rect x="${x}" y="${y}" width="118" height="118" rx="18" fill="#eef2ff" />
    <text x="${x + 59}" y="${y + 54}" text-anchor="middle" font-family="'PingFang SC', sans-serif" font-size="14" font-weight="700" fill="#52618f">二维码</text>
    <text x="${x + 59}" y="${y + 76}" text-anchor="middle" font-family="'PingFang SC', sans-serif" font-size="14" font-weight="700" fill="#52618f">待补充</text>
  `;
}

function renderMemberCard(member: MemberCard, index: number): string {
  const { x, y } = cardPosition(index);
  const titleLines = wrapText(member.title, 19, 2);
  const descriptionLines = wrapText(member.description ?? '', 17.5, 4);
  const accountLines = wrapText(member.wechatAccount ?? '公众号待补充', 11.5, 2);

  return `
    <g filter="url(#cardShadow)">
      <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="34" fill="rgba(9,24,79,0.82)" stroke="rgba(255,255,255,0.16)" stroke-width="1.5" />
      <rect x="${x + 16}" y="${y + 16}" width="${cardWidth - 32}" height="10" rx="5" fill="url(#accentBar)" opacity="0.95" />
      <circle cx="${x + 70}" cy="${y + 70}" r="48" fill="#dcebff" opacity="0.22" />
      <circle cx="${x + 70}" cy="${y + 70}" r="44" fill="#ffffff" opacity="0.98" />
      <image href="${member.avatarUri}" x="${x + 28}" y="${y + 28}" width="84" height="84" clip-path="url(#avatar-${member.id})" preserveAspectRatio="xMidYMid slice" />
      <text x="${x + 126}" y="${y + 64}" font-family="'PingFang SC', 'Hiragino Sans GB', sans-serif" font-size="28" font-weight="800" fill="#ffffff">${escapeXml(member.name)}</text>
      <rect x="${x + 126}" y="${y + 78}" width="86" height="28" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" stroke-width="1" />
      <text x="${x + 169}" y="${y + 97}" text-anchor="middle" font-family="'PingFang SC', sans-serif" font-size="14" font-weight="600" fill="#f6e8bf">${escapeXml(cleanText(member.location) || 'KA21')}</text>
      ${renderLines(titleLines, x + 28, y + 144, 22, { size: 16, fill: '#bdd0ff', weight: 600 })}
      <line x1="${x + 28}" y1="${y + 192}" x2="${x + cardWidth - 28}" y2="${y + 192}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
      <text x="${x + 28}" y="${y + 224}" font-family="'PingFang SC', sans-serif" font-size="14" font-weight="700" fill="#ffd88e">简介</text>
      ${renderLines(descriptionLines, x + 28, y + 252, 24, { size: 16, fill: '#e6eeff', weight: 500 })}
      <line x1="${x + 28}" y1="${y + 338}" x2="${x + cardWidth - 28}" y2="${y + 338}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
      <text x="${x + 28}" y="${y + 370}" font-family="'PingFang SC', sans-serif" font-size="14" font-weight="700" fill="#7be6ff">公众号</text>
      ${renderLines(accountLines, x + 28, y + 398, 24, { size: 18, fill: '#ffffff', weight: 700 })}
      ${qrBlock(member, x + 208, y + 286)}
    </g>
  `;
}

async function loadMembers(): Promise<MemberCard[]> {
  return Promise.all(
    teamMembers.map(async (member) => {
      const override = posterOverrides[member.id] ?? {};
      const avatarPath = await resolveAvatarAsset(member.id, member.avatar);
      const wechatQrPath = cleanText(member.wechatQR || '');
      const qrPath = member.id === 'fenglaoshi'
        ? resolvePublicAsset('/images/team/qr-fenglaoshi.jpg')
        : wechatQrPath
          ? resolvePublicAsset(wechatQrPath)
          : '';

      let qrUri = '';
      if (qrPath) {
        try {
          qrUri = await fileToDataUri(qrPath);
        } catch {
          qrUri = '';
        }
      }

      return {
        id: member.id,
        name: member.name,
        title: cleanText(member.title),
        location: cleanText(member.location),
        specialty: cleanText(member.specialty),
        description: cleanText(override.description) || firstSentence(member.description),
        wechatAccount: cleanText(override.wechatAccount) || cleanText(member.wechatAccount) || (member.id === 'fenglaoshi' ? '风老师' : ''),
        avatarUri: await fileToDataUri(avatarPath),
        qrUri,
      };
    }),
  );
}

async function buildPosterSvg(): Promise<string> {
  const members = await loadMembers();
  const ka21Logo = await publicAssetToDataUri('/KA21-white.svg');
  const dengxiaLogo = await publicAssetToDataUri('/images/podcast/dengxiabai-logo.svg');
  const clipDefs = buildClipDefs(members);

  const cards = members.map((member, index) => renderMemberCard(member, index)).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#153db9" />
          <stop offset="38%" stop-color="#2049c6" />
          <stop offset="78%" stop-color="#173a9e" />
          <stop offset="100%" stop-color="#112b76" />
        </linearGradient>
        <linearGradient id="accentBar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffd97d" />
          <stop offset="50%" stop-color="#ffb665" />
          <stop offset="100%" stop-color="#79deff" />
        </linearGradient>
        <radialGradient id="titleGlow" cx="50%" cy="20%" r="55%">
          <stop offset="0%" stop-color="#8de0ff" stop-opacity="0.42" />
          <stop offset="100%" stop-color="#8de0ff" stop-opacity="0" />
        </radialGradient>
        <filter id="titleBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="cardShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#08133d" flood-opacity="0.34" />
        </filter>
        ${clipDefs}
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
      <rect width="${width}" height="${height}" fill="url(#titleGlow)" />

      <g opacity="0.92">
        <path d="M-30 34C106 98 124 232 76 364C13 534 32 694 144 856C208 948 226 1082 174 1248C115 1436 126 1596 230 1760C286 1848 302 1986 250 2280H-60V0H20C22 12 8 18 -30 34Z" fill="#ffe4a5" />
        <path d="M1442 0C1374 54 1351 166 1388 290C1444 476 1433 616 1336 770C1262 888 1238 1016 1292 1164C1350 1326 1344 1494 1244 1674C1186 1776 1164 1930 1206 2280H1660V0H1442Z" fill="#ffe4a5" />
        <path d="M210 182C284 252 300 346 252 450C220 522 224 608 278 686" fill="none" stroke="#fff0cd" stroke-width="30" stroke-linecap="round" opacity="0.42" />
        <path d="M1316 176C1246 236 1224 322 1260 430C1284 498 1272 586 1208 664" fill="none" stroke="#fff0cd" stroke-width="30" stroke-linecap="round" opacity="0.38" />
      </g>

      <g opacity="0.98">
        <image href="${ka21Logo}" x="48" y="34" width="176" height="88" preserveAspectRatio="xMidYMid meet" />
        <image href="${dengxiaLogo}" x="1452" y="34" width="76" height="76" preserveAspectRatio="xMidYMid meet" />
      </g>

      <g>
        <text x="800" y="142" text-anchor="middle" font-family="'Arial Rounded MT Bold', 'PingFang SC', sans-serif" font-size="104" font-weight="900" fill="#f3b25d" opacity="0.9" filter="url(#titleBlur)">灯下白的</text>
        <text x="800" y="142" text-anchor="middle" font-family="'Arial Rounded MT Bold', 'PingFang SC', sans-serif" font-size="104" font-weight="900" fill="#fffdf7" stroke="#de9d4a" stroke-width="16" paint-order="stroke fill">灯下白的</text>
        <text x="800" y="258" text-anchor="middle" font-family="'Arial Rounded MT Bold', 'PingFang SC', sans-serif" font-size="128" font-weight="900" fill="#f3b25d" opacity="0.9" filter="url(#titleBlur)">AI圈朋友们</text>
        <text x="800" y="258" text-anchor="middle" font-family="'Arial Rounded MT Bold', 'PingFang SC', sans-serif" font-size="128" font-weight="900" fill="#fffdf7" stroke="#de9d4a" stroke-width="18" paint-order="stroke fill">AI圈朋友们</text>
      </g>

      <g>
        ${cards}
      </g>

      <g opacity="0.96">
        <text x="1540" y="2240" text-anchor="end" font-family="'PingFang SC', sans-serif" font-size="22" font-weight="700" fill="#fff0c9">扫码与有趣的灵魂们交个朋友！</text>
      </g>
    </svg>
  `;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const svg = await buildPosterSvg();
  const svgPath = path.join(outputDir, `${outputBase}.svg`);
  const pngPath = path.join(outputDir, `${outputBase}.png`);

  await fs.writeFile(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(pngPath);

  console.log(`Generated poster:\n${svgPath}\n${pngPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
