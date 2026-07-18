import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

import { fetchAndExtractFulltext, normalizeText, safeText } from '../src/lib/miniapp/tutorial-fulltext';
import { discoverWechatPublishHistory, type WechatPublishedArticle } from './lib/wechat-publish-history';

type PersonalArticle = {
  t: string;
  d: string;
  u: string;
  c: string;
  n: number;
  img?: string;
  kind?: 'image';
  mid?: string;
  idx?: number;
  discoveryContent?: string;
  trustedCover?: boolean;
  coverNeedsCrop?: boolean;
  discoveryCover?: string;
};

type PersonalArticlesFile = {
  updatedAt: string;
  total: number;
  items: PersonalArticle[];
};

type SearchIndexItem = {
  title: string;
  url: string;
  category: string;
  date: string;
  number: number;
  image?: string;
  kind?: 'image';
  mid?: string;
  idx?: number;
  content: string;
  fallback: boolean;
  source: 'wechat-fulltext' | 'fallback-meta';
  cachedAt: string;
  error?: string;
};

type SearchIndexFile = {
  updatedAt: string;
  total: number;
  items: SearchIndexItem[];
};

type SearchStatus = 'cached' | 'fetched' | 'fallback' | 'reused';

type TextBlock = {
  type?: string;
  text?: string;
};

type WechatAlbumSource = {
  albumId: string;
  label: string;
  defaultCategory: string;
};

type WechatAlbumArticle = {
  cover_img_1_1?: string;
  create_time?: string;
  itemidx?: string;
  msgid?: string;
  title?: string;
  url?: string;
};

type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

const rootDir = path.resolve(__dirname, '..');
const personalIndexPath = path.join(rootDir, 'public', 'personal-site', 'index.html');
const personalArticlesPath = path.join(rootDir, 'data', 'personal-site', 'articles.json');
const searchIndexOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.json');
const searchIndexScriptOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.js');
const personalCoversDir = path.join(rootDir, 'public', 'personal-site', 'covers');
const faceDetectorSource = path.join(rootDir, 'scripts', 'lib', 'detect-image-faces.m');
const faceDetectorBinary = path.join(tmpdir(), 'ka21-wechat-face-detector-v1');
const execFileAsync = promisify(execFile);
const targetCoverWidth = 1280;
const targetCoverHeight = 545;
const targetCoverRatio = targetCoverWidth / targetCoverHeight;
const cardSafeWidthRatio = (16 / 9) / targetCoverRatio;
const wechatHosts = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);
const wechatImageHostPattern = /(^|\.)(qpic|qlogo)\.cn$/;
const wechatBiz = 'Mzg5ODU1ODg1Mg==';
const wechatAlbumSources: WechatAlbumSource[] = [
  {
    albumId: '3672103436448808968',
    label: 'AIGC辅助英语教学',
    defaultCategory: 'AI教学思考',
  },
  {
    albumId: '4521209267995213830',
    label: 'AI赋能工作流系列',
    defaultCategory: 'AI教学思考',
  },
];

function canonicalizeArticleUrl(rawUrl: string): string {
  const value = safeText(rawUrl).trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (wechatHosts.has(parsed.hostname)) {
      parsed.protocol = 'https:';
      parsed.hostname = 'mp.weixin.qq.com';
    }
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return value;
  }
}

function normalizeArticle(article: PersonalArticle): PersonalArticle {
  return {
    t: safeText(article.t),
    d: safeText(article.d),
    u: canonicalizeArticleUrl(article.u),
    c: safeText(article.c),
    n: Number.isFinite(article.n) ? article.n : 0,
    img: safeText(article.img) || undefined,
    kind: article.kind === 'image' ? 'image' : undefined,
    mid: safeText(article.mid) || extractWechatIdentity(article.u)?.mid,
    idx: Number.isFinite(article.idx) ? article.idx : extractWechatIdentity(article.u)?.idx,
    discoveryContent: safeText(article.discoveryContent) || undefined,
    trustedCover: article.trustedCover === true || undefined,
    coverNeedsCrop: article.coverNeedsCrop === true || undefined,
    discoveryCover: normalizeAlbumImage(article.discoveryCover),
  };
}

function extractWechatIdentity(rawUrl: string): { mid: string; idx: number } | undefined {
  try {
    const url = new URL(canonicalizeArticleUrl(rawUrl));
    const mid = safeText(url.searchParams.get('mid'));
    const idx = Number(url.searchParams.get('idx') || '1');
    if (mid && Number.isFinite(idx)) return { mid, idx };
  } catch {
    // Short WeChat URLs do not expose the appmsg id.
  }
  return undefined;
}

function articleIdentity(article: PersonalArticle): string {
  const mid = safeText(article.mid) || extractWechatIdentity(article.u)?.mid;
  const idx = Number.isFinite(article.idx) ? Number(article.idx) : extractWechatIdentity(article.u)?.idx;
  if (mid) return `wechat:${mid}:${idx || 1}`;
  return `url:${canonicalizeArticleUrl(article.u)}`;
}

function formatShanghaiDate(epochSeconds: string | number | undefined): string {
  const timestamp = Number(epochSeconds);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp * 1000));
}

function inferCategory(title: string, fallback: string): string {
  const value = safeText(title);

  if (/灯下白|KA21|社群|个人网站|牛马库/.test(value)) return '社群与项目';
  if (/PPT|课件|海报|画图|配图|封面|图片|WPS/.test(value)) return '课件与配图';
  if (/视频|音频|逐字稿|播客|配音/.test(value)) return '视频与音频';
  if (/直播|Agent|Codex|Skill|skill|工具|产品|助理|编程|开源|LibTV/.test(value)) return 'AI工具测评';
  if (/Google|成长|心得|受邀|老师|教师/.test(value)) return '教师成长';

  return fallback;
}

function normalizeAlbumImage(rawUrl: string | undefined): string | undefined {
  const value = safeText(rawUrl).trim();
  if (!value) return undefined;
  if (value.startsWith('//')) return `https:${value}`;
  return value.replace(/^http:/, 'https:');
}

function isRemoteUrl(rawUrl: string | undefined): boolean {
  const value = safeText(rawUrl).trim();
  return /^https?:\/\//i.test(value);
}

function isWechatImageUrl(rawUrl: string | undefined): boolean {
  const value = safeText(rawUrl).trim();
  if (!isRemoteUrl(value)) return false;

  try {
    const parsed = new URL(value);
    return wechatImageHostPattern.test(parsed.hostname);
  } catch {
    return false;
  }
}

function buildWechatImageCandidates(rawUrl: string): string[] {
  const normalized = normalizeAlbumImage(rawUrl);
  if (!normalized) return [];

  const candidates = new Set<string>();
  candidates.add(normalized);

  const parsed = new URL(normalized);
  if (parsed.pathname.endsWith('/300')) {
    const highRes = new URL(parsed);
    highRes.pathname = highRes.pathname.replace(/\/300$/, '/640');
    candidates.add(highRes.toString());

    const originalSize = new URL(parsed);
    originalSize.pathname = originalSize.pathname.replace(/\/300$/, '/0');
    candidates.add(originalSize.toString());
  }

  return [...candidates];
}

function extensionFromContentType(contentType: string | null): string {
  const value = safeText(contentType).toLowerCase();
  if (value.includes('png')) return 'png';
  if (value.includes('webp')) return 'webp';
  if (value.includes('gif')) return 'gif';
  return 'jpg';
}

function buildCoverHash(rawUrl: string, cropToHead = false): string {
  const cacheKey = cropToHead ? `${rawUrl}|wechat-head-face-safe-v3` : rawUrl;
  return createHash('sha256').update(cacheKey).digest('hex').slice(0, 12);
}

let faceDetectorReady: Promise<boolean> | undefined;

async function ensureFaceDetector(): Promise<boolean> {
  if (process.platform !== 'darwin') return false;
  if (!faceDetectorReady) {
    faceDetectorReady = (async () => {
      try {
        await execFileAsync('/usr/bin/clang', [
          '-fobjc-arc',
          '-framework', 'Foundation',
          '-framework', 'CoreGraphics',
          '-framework', 'ImageIO',
          '-framework', 'Vision',
          faceDetectorSource,
          '-O2',
          '-o', faceDetectorBinary,
        ]);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[personal-fulltext] face detector unavailable: ${message}`);
        return false;
      }
    })();
  }
  return faceDetectorReady;
}

async function detectFaces(buffer: Buffer, cacheKey: string): Promise<FaceBox[]> {
  if (!(await ensureFaceDetector())) return [];

  const inputPath = path.join(tmpdir(), `ka21-wechat-face-${buildCoverHash(cacheKey)}.jpg`);
  try {
    await sharp(buffer).rotate().jpeg({ quality: 92 }).toFile(inputPath);
    const { stdout } = await execFileAsync(faceDetectorBinary, [inputPath], { maxBuffer: 1024 * 1024 });
    const parsed = JSON.parse(stdout) as FaceBox[];
    return parsed.filter((face) =>
      face.confidence >= 0.3 &&
      face.width > 0 &&
      face.height > 0 &&
      [face.x, face.y, face.width, face.height].every(Number.isFinite));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[personal-fulltext] face detection failed: ${message}`);
    return [];
  } finally {
    try {
      await unlink(inputPath);
    } catch {
      // Temporary input may not have been written.
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function expandedFaceBounds(faces: FaceBox[], width: number, height: number) {
  const bounds = faces.map((face) => {
    const left = face.x * width;
    const top = face.y * height;
    const faceWidth = face.width * width;
    const faceHeight = face.height * height;
    return {
      left: Math.max(0, left - faceWidth * 0.4),
      top: Math.max(0, top - faceHeight * 0.8),
      right: Math.min(width, left + faceWidth * 1.4),
      bottom: Math.min(height, top + faceHeight * 1.55),
    };
  });

  return {
    left: Math.min(...bounds.map((box) => box.left)),
    top: Math.min(...bounds.map((box) => box.top)),
    right: Math.max(...bounds.map((box) => box.right)),
    bottom: Math.max(...bounds.map((box) => box.bottom)),
  };
}

function chooseFaceSafeCrop(
  faces: FaceBox[],
  width: number,
  height: number,
): { left: number; top: number; width: number; height: number } | undefined {
  const bounds = expandedFaceBounds(faces, width, height);
  const sourceRatio = width / height;
  const cropWidth = sourceRatio > targetCoverRatio ? height * targetCoverRatio : width;
  const cropHeight = sourceRatio > targetCoverRatio ? height : width / targetCoverRatio;
  const safeInset = cropWidth * (1 - cardSafeWidthRatio) / 2;

  if (
    bounds.bottom - bounds.top > cropHeight ||
    bounds.right - bounds.left > cropWidth - safeInset * 2
  ) return undefined;

  const minLeft = Math.max(0, bounds.right - cropWidth + safeInset);
  const maxLeft = Math.min(width - cropWidth, bounds.left - safeInset);
  if (minLeft > maxLeft) return undefined;

  const minTop = Math.max(0, bounds.bottom - cropHeight);
  const maxTop = Math.min(height - cropHeight, bounds.top);
  if (minTop > maxTop) return undefined;

  const preferredLeft = (bounds.left + bounds.right - cropWidth) / 2;
  const preferredTop = (bounds.top + bounds.bottom - cropHeight) / 2;
  return {
    left: Math.round(clamp(preferredLeft, minLeft, maxLeft)),
    top: Math.round(clamp(preferredTop, minTop, maxTop)),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}

function facesAreCardSafe(faces: FaceBox[]): boolean {
  const safeInset = (1 - cardSafeWidthRatio) / 2;
  return faces.every((face) =>
    face.x >= safeInset &&
    face.x + face.width <= 1 - safeInset &&
    face.y >= 0.005 &&
    face.y + face.height <= 0.995);
}

async function createContainedFaceSafeCover(buffer: Buffer): Promise<Buffer> {
  const safeWidth = Math.floor(targetCoverWidth * cardSafeWidthRatio);
  const background = await sharp(buffer)
    .rotate()
    .resize(targetCoverWidth, targetCoverHeight, { fit: 'cover', position: sharp.strategy.attention })
    .blur(24)
    .modulate({ brightness: 0.72, saturation: 0.78 })
    .jpeg({ quality: 90 })
    .toBuffer();
  const foreground = await sharp(buffer)
    .rotate()
    .resize(safeWidth, targetCoverHeight, { fit: 'inside', withoutEnlargement: false })
    .jpeg({ quality: 92 })
    .toBuffer({ resolveWithObject: true });

  return sharp(background)
    .composite([{
      input: foreground.data,
      left: Math.round((targetCoverWidth - foreground.info.width) / 2),
      top: Math.round((targetCoverHeight - foreground.info.height) / 2),
    }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function createFaceSafeHeadCover(buffer: Buffer, sourceUrl: string): Promise<Buffer> {
  const oriented = sharp(buffer).rotate();
  const metadata = await oriented.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const faces = width && height ? await detectFaces(buffer, sourceUrl) : [];

  if (faces.length === 0) {
    const candidate = await oriented
      .resize(targetCoverWidth, targetCoverHeight, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    const candidateFaces = await detectFaces(candidate, `${sourceUrl}|candidate`);
    if (candidateFaces.length > 0 && !facesAreCardSafe(candidateFaces)) {
      console.log(`[personal-fulltext] face-safe cover faces=${candidateFaces.length} mode=contain-after-crop-audit`);
      return createContainedFaceSafeCover(buffer);
    }
    return candidate;
  }

  const crop = chooseFaceSafeCrop(faces, width, height);
  if (!crop) {
    console.log(`[personal-fulltext] face-safe cover faces=${faces.length} mode=contain`);
    return createContainedFaceSafeCover(buffer);
  }

  console.log(`[personal-fulltext] face-safe cover faces=${faces.length} mode=crop`);
  return oriented
    .extract(crop)
    .resize(targetCoverWidth, targetCoverHeight, { fit: 'fill' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

function readJpegSize(buffer: Buffer): { width: number; height: number } | undefined {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return undefined;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return undefined;

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return undefined;
}

function readPngSize(buffer: Buffer): { width: number; height: number } | undefined {
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== pngSignature) return undefined;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function readLocalCoverSize(imagePath: string | undefined): Promise<{ width: number; height: number } | undefined> {
  const value = safeText(imagePath).trim();
  if (!value.startsWith('covers/')) return undefined;

  try {
    const buffer = await readFile(path.join(rootDir, 'public', 'personal-site', value));
    return readJpegSize(buffer) || readPngSize(buffer);
  } catch {
    return undefined;
  }
}

function isWechatHeadCoverRatio(size: { width: number; height: number } | undefined): boolean {
  if (!size?.width || !size.height) return false;
  const ratio = size.width / size.height;
  return ratio >= 2.25 && ratio <= 2.45;
}

async function shouldRefreshWechatHeadCover(article: PersonalArticle): Promise<boolean> {
  try {
    if (!wechatHosts.has(new URL(canonicalizeArticleUrl(article.u)).hostname)) return false;
  } catch {
    return false;
  }

  if (isWechatImageUrl(article.img)) return true;
  if (article.kind === 'image' && isWechatImageUrl(article.discoveryCover)) return true;
  if (article.kind === 'image') {
    return !isWechatHeadCoverRatio(await readLocalCoverSize(article.img));
  }
  if (article.n > 0) return false;

  const size = await readLocalCoverSize(article.img);
  if (!size?.width || !size.height) return false;

  // WeChat article head images in this site are wide cards, usually around 21:9.
  // A square local cover means we likely cached the album thumbnail instead.
  return size.width / size.height < 1.8;
}

async function findExistingCachedCover(rawUrl: string, cropToHead = false): Promise<string | undefined> {
  const hash = buildCoverHash(rawUrl, cropToHead);
  for (const ext of ['jpg', 'png', 'webp', 'gif']) {
    const filename = `${hash}.${ext}`;
    try {
      const existing = await readFile(path.join(personalCoversDir, filename));
      if (existing.length > 0) return `covers/${filename}`;
    } catch {
      // Try the next possible extension.
    }
  }
  return undefined;
}

async function downloadWechatCover(rawUrl: string, cropToHead = false): Promise<string | undefined> {
  const existing = await findExistingCachedCover(rawUrl, cropToHead);
  if (existing) return existing;

  await mkdir(personalCoversDir, { recursive: true });

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Referer: 'https://mp.weixin.qq.com/',
  } as const;

  for (const candidate of buildWechatImageCandidates(rawUrl)) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(candidate, {
          headers,
          cache: 'no-store',
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok || !safeText(contentType).startsWith('image/')) continue;

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 1024) continue;

        const output = cropToHead ? await createFaceSafeHeadCover(buffer, rawUrl) : buffer;
        const ext = cropToHead ? 'jpg' : extensionFromContentType(contentType);
        const filename = `${buildCoverHash(rawUrl, cropToHead)}.${ext}`;
        await writeFile(path.join(personalCoversDir, filename), output);
        return `covers/${filename}`;
      } catch {
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        }
      }
    }
  }

  return undefined;
}

async function fetchArticleHeadCover(article: PersonalArticle): Promise<string | undefined> {
  const url = canonicalizeArticleUrl(article.u);
  if (!url) return undefined;

  try {
    const fulltext = await fetchAndExtractFulltext(url, { timeoutMs: 20_000, allowCurlFallback: true });
    const firstContentImage = article.kind === 'image'
      ? fulltext.blocks.find((block) => block.type === 'image')?.src
      : undefined;
    const cover = normalizeAlbumImage(firstContentImage || fulltext.cover);
    return isWechatImageUrl(cover) ? cover : undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[personal-fulltext] cover fetch failed ${url}: ${message}`);
    return undefined;
  }
}

async function localizeWechatCoverImages(articles: PersonalArticle[]): Promise<PersonalArticle[]> {
  let localized = 0;
  let fallback = 0;
  let failed = 0;
  const articleCoverCache = new Map<string, string | undefined>();
  const localCoverCache = new Map<string, string | undefined>();
  const out: PersonalArticle[] = [];

  for (const article of articles) {
    const image = safeText(article.img);
    if (!(await shouldRefreshWechatHeadCover(article))) {
      out.push(article);
      continue;
    }

    const articleUrl = canonicalizeArticleUrl(article.u);
    let headCover = normalizeAlbumImage(article.discoveryCover)
      || (article.trustedCover && isWechatImageUrl(image) ? image : articleCoverCache.get(articleUrl));
    if (!headCover && !articleCoverCache.has(articleUrl)) {
      headCover = await fetchArticleHeadCover(article);
      articleCoverCache.set(articleUrl, headCover);
    }

    const sourceImage = headCover || '';
    if (!sourceImage) {
      failed += 1;
      out.push({ ...article, img: undefined, trustedCover: undefined });
      continue;
    }

    let localImage = localCoverCache.get(sourceImage);
    if (!localCoverCache.has(sourceImage)) {
      const cropToHead = article.coverNeedsCrop === true || (article.kind === 'image' && article.trustedCover !== true);
      localImage = await downloadWechatCover(sourceImage, cropToHead);
      localCoverCache.set(sourceImage, localImage);
    }

    if (localImage) {
      const size = await readLocalCoverSize(localImage);
      if (!isWechatHeadCoverRatio(size)) {
        failed += 1;
        console.warn(
          `[personal-fulltext] rejected non-2.35:1 cover ${articleUrl} size=${size ? `${size.width}x${size.height}` : 'unknown'}`,
        );
        out.push({ ...article, img: undefined, trustedCover: undefined });
        continue;
      }

      if (headCover) {
        localized += 1;
      } else {
        fallback += 1;
      }
      out.push({ ...article, img: localImage });
    } else {
      failed += 1;
      out.push({ ...article, img: undefined, trustedCover: undefined });
    }
  }

  if (localized > 0 || fallback > 0 || failed > 0) {
    console.log(`[personal-fulltext] wechat covers localized=${localized} fallback=${fallback} failed=${failed}`);
  }

  return out;
}

function albumArticleToPersonalArticle(article: WechatAlbumArticle, source: WechatAlbumSource): PersonalArticle | null {
  const title = safeText(article.title).trim();
  const url = canonicalizeArticleUrl(safeText(article.url));
  if (!title || !url) return null;

  return normalizeArticle({
    t: title,
    d: formatShanghaiDate(article.create_time),
    u: url,
    c: inferCategory(title, source.defaultCategory),
    n: 0,
    img: normalizeAlbumImage(article.cover_img_1_1),
  });
}

function publishedArticleToPersonalArticle(article: WechatPublishedArticle): PersonalArticle | null {
  const title = safeText(article.title).trim();
  const url = canonicalizeArticleUrl(article.url);
  if (!title || !url) return null;

  return normalizeArticle({
    t: title,
    d: formatShanghaiDate(article.createTime),
    u: url,
    c: inferCategory(title, 'AI教学思考'),
    n: 0,
    img: normalizeAlbumImage(article.cover),
    kind: article.kind === 'image' ? 'image' : undefined,
    mid: safeText(article.appmsgId),
    idx: Number.isFinite(article.itemIdx) ? article.itemIdx : 1,
    discoveryContent: article.kind === 'image'
      ? normalizeText(article.digest || `图片文章，共${article.imageCount}张图片`)
      : undefined,
    trustedCover: article.coverIsHead || article.coverNeedsCrop,
    coverNeedsCrop: article.coverNeedsCrop,
    discoveryCover: normalizeAlbumImage(article.cover),
  });
}

function buildWechatAlbumUrl(source: WechatAlbumSource, beginMsgId: string, beginItemIdx: string): string {
  const params = new URLSearchParams({
    action: 'getalbum',
    __biz: wechatBiz,
    album_id: source.albumId,
    count: '20',
    begin_msgid: beginMsgId,
    begin_itemidx: beginItemIdx,
    uin: '',
    key: '',
    pass_ticket: '',
    wxtoken: '',
    devicetype: '',
    clientversion: '',
    appmsg_token: '',
    x5: '0',
    f: 'json',
  });

  return `https://mp.weixin.qq.com/mp/appmsgalbum?${params.toString()}`;
}

async function fetchAlbumArticles(source: WechatAlbumSource): Promise<PersonalArticle[]> {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Referer: 'https://mp.weixin.qq.com/',
  } as const;
  const out: PersonalArticle[] = [];
  let beginMsgId = '0';
  let beginItemIdx = '0';

  for (let page = 1; page <= 30; page += 1) {
    const response = await fetch(buildWechatAlbumUrl(source, beginMsgId, beginItemIdx), {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`album-fetch-failed-${source.albumId}-${response.status}`);
    }

    const payload = await response.json() as {
      base_resp?: { ret?: number; errmsg?: string };
      getalbum_resp?: {
        article_list?: WechatAlbumArticle[];
        base_info?: { article_count?: string };
        continue_flag?: string | number;
      };
    };

    if (payload.base_resp?.ret !== 0) {
      throw new Error(`album-response-failed-${source.albumId}-${payload.base_resp?.ret}-${payload.base_resp?.errmsg || 'unknown'}`);
    }

    const resp = payload.getalbum_resp || {};
    const list = Array.isArray(resp.article_list) ? resp.article_list : [];
    console.log(
      `[personal-fulltext] album ${source.label} page=${page} items=${list.length} total=${resp.base_info?.article_count || 'unknown'} continue=${resp.continue_flag ?? '0'}`,
    );

    for (const item of list) {
      const article = albumArticleToPersonalArticle(item, source);
      if (article) out.push(article);
    }

    if (!list.length || String(resp.continue_flag || '0') !== '1') break;

    const last = list[list.length - 1];
    beginMsgId = safeText(last.msgid) || beginMsgId;
    beginItemIdx = safeText(last.itemidx) || beginItemIdx;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return out;
}

function compareArticleDates(a: PersonalArticle, b: PersonalArticle): number {
  const dateCompare = safeText(a.d).localeCompare(safeText(b.d));
  if (dateCompare !== 0) return dateCompare;

  if (a.n !== b.n) return a.n - b.n;
  return safeText(a.u).localeCompare(safeText(b.u));
}

function mergeDiscoveredArticle(existing: PersonalArticle | undefined, discovered: PersonalArticle): PersonalArticle {
  if (!existing) return discovered;

  return normalizeArticle({
    ...existing,
    t: discovered.t || existing.t,
    d: discovered.d || existing.d,
    c: discovered.c || existing.c,
    kind: discovered.kind || existing.kind,
    mid: discovered.mid || existing.mid,
    idx: discovered.idx || existing.idx,
    discoveryContent: discovered.discoveryContent || existing.discoveryContent,
    trustedCover: discovered.trustedCover || existing.trustedCover,
    coverNeedsCrop: discovered.coverNeedsCrop || existing.coverNeedsCrop,
    discoveryCover: discovered.discoveryCover || existing.discoveryCover,
    // Keep an existing local cover. New rows retain the remote cover for localization.
    img: isRemoteUrl(existing.img) ? (discovered.img || existing.img) : (existing.img || discovered.img),
    u: existing.u || discovered.u,
    n: existing.n,
  });
}

async function mergeDiscoveredArticles(articles: PersonalArticle[]): Promise<PersonalArticle[]> {
  const map = new Map<string, PersonalArticle>();
  const urlToKey = new Map<string, string>();

  for (const article of articles) {
    if (!article.u) continue;
    const key = articleIdentity(article);
    map.set(key, article);
    urlToKey.set(canonicalizeArticleUrl(article.u), key);
  }

  let discovered = 0;
  let added = 0;
  let updated = 0;
  let fullDiscoverySucceeded = false;

  try {
    const history = await discoverWechatPublishHistory();
    discovered += history.articles.length;

    for (const raw of history.articles) {
      const article = publishedArticleToPersonalArticle(raw);
      if (!article) continue;
      const identityKey = articleIdentity(article);
      const existingKey = map.has(identityKey) ? identityKey : urlToKey.get(article.u);
      const existing = existingKey ? map.get(existingKey) : undefined;
      const merged = mergeDiscoveredArticle(existing, article);

      if (existingKey && existingKey !== identityKey) map.delete(existingKey);
      map.set(identityKey, merged);
      urlToKey.set(merged.u, identityKey);
      if (existing) updated += 1;
      else added += 1;
    }

    console.log(
      `[personal-fulltext] publish history records=${history.totalRecords} articles=${history.articles.length} added=${added} updated=${updated}`,
    );
    fullDiscoverySucceeded = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.WECHAT_ALLOW_ALBUM_FALLBACK !== '1') {
      throw new Error(`wechat-full-discovery-unavailable: ${message}`);
    }
    console.warn(`[personal-fulltext] publish history unavailable (${message}); explicit album fallback enabled`);
  }

  for (const source of wechatAlbumSources) {
    let albumArticles: PersonalArticle[];
    try {
      albumArticles = await fetchAlbumArticles(source);
    } catch (error) {
      if (!fullDiscoverySucceeded) throw error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[personal-fulltext] supplemental album ${source.label} unavailable: ${message}`);
      continue;
    }
    discovered += albumArticles.length;

    for (const article of albumArticles) {
      if (!article.u) continue;
      const key = articleIdentity(article);
      const existingKey = map.has(key) ? key : urlToKey.get(article.u);
      const existing = existingKey ? map.get(existingKey) : undefined;
      if (existing) continue;
      map.set(key, article);
      urlToKey.set(article.u, key);
      added += 1;
    }
  }

  const merged = [...map.values()].sort(compareArticleDates);
  console.log(`[personal-fulltext] discovery found=${discovered} added=${added} updated=${updated} total=${merged.length}`);
  return merged;
}

function buildVersionTag(updatedAt: string): string {
  return updatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let force = false;
  let limit = Number.POSITIVE_INFINITY;
  let concurrency = Number(process.env.FULLTEXT_CONCURRENCY || '4');

  for (const arg of args) {
    if (arg === '--force') force = true;
    if (arg.startsWith('--limit=')) {
      const n = Number(arg.slice('--limit='.length));
      if (Number.isFinite(n) && n > 0) limit = n;
    }
    if (arg.startsWith('--concurrency=')) {
      const n = Number(arg.slice('--concurrency='.length));
      if (Number.isFinite(n) && n > 0) concurrency = n;
    }
  }

  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    concurrency = 4;
  }

  return { force, limit, concurrency };
}

function parseEmbeddedArticles(rawHtml: string): PersonalArticle[] {
  const match = rawHtml.match(/const ARTS\s*=\s*(\[[\s\S]*?\]);\s*const MONTHS/);
  if (!match?.[1]) {
    throw new Error(`failed-to-extract-arts-array from ${personalIndexPath}`);
  }

  const parsed = JSON.parse(match[1]) as PersonalArticle[];
  return parsed.filter((item) => !!item?.u && !!item?.t).map(normalizeArticle);
}

async function readArticles(): Promise<PersonalArticle[]> {
  let articles: PersonalArticle[];

  try {
    const raw = await readFile(personalArticlesPath, 'utf8');
    const parsed = JSON.parse(raw) as PersonalArticlesFile;
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      articles = parsed.items.filter((item) => !!item?.u && !!item?.t).map(normalizeArticle);
      return mergeDiscoveredArticles(articles);
    }
  } catch {
    // Fall back to embedded data below.
  }

  const rawHtml = await readFile(personalIndexPath, 'utf8');
  articles = parseEmbeddedArticles(rawHtml);
  return mergeDiscoveredArticles(articles);
}

async function loadExisting(): Promise<Map<string, SearchIndexItem>> {
  try {
    const raw = await readFile(searchIndexOutputPath, 'utf8');
    const parsed = JSON.parse(raw) as SearchIndexFile;
    const map = new Map<string, SearchIndexItem>();

    for (const item of parsed.items || []) {
      if (item?.url) {
        const normalizedUrl = canonicalizeArticleUrl(item.url);
        map.set(normalizedUrl, {
          ...item,
          url: normalizedUrl,
        });
      }
    }

    return map;
  } catch {
    return new Map();
  }
}

function blocksToText(blocks: TextBlock[]): string {
  return normalizeText(
    blocks
      .filter((block) => block && typeof block.text === 'string' && block.type !== 'image')
      .map((block) => block.text?.trim() || '')
      .filter(Boolean)
      .join('\n\n'),
  );
}

function buildFallbackItem(article: PersonalArticle, reason?: string): SearchIndexItem {
  const fallbackContent = normalizeText(
    [
      safeText(article.t),
      safeText(article.discoveryContent),
      article.c ? `分类：${article.c}` : '',
      article.d ? `发布日期：${article.d}` : '',
      article.n > 0 ? `编号：吴熳教学思考${article.n}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  );

  return {
    title: safeText(article.t),
    url: safeText(article.u),
    category: safeText(article.c),
    date: safeText(article.d),
    number: Number.isFinite(article.n) ? article.n : 0,
    image: safeText(article.img) || undefined,
    kind: article.kind,
    mid: safeText(article.mid) || undefined,
    idx: Number.isFinite(article.idx) ? article.idx : undefined,
    content: fallbackContent,
    fallback: true,
    source: 'fallback-meta',
    cachedAt: new Date().toISOString(),
    error: reason || undefined,
  };
}

async function buildItem(
  article: PersonalArticle,
  existingMap: Map<string, SearchIndexItem>,
  force: boolean,
): Promise<{ item: SearchIndexItem; status: SearchStatus }> {
  const url = canonicalizeArticleUrl(article.u);
  const existing = existingMap.get(url);
  const discoveryContent = normalizeText(safeText(article.discoveryContent));

  if (article.kind === 'image' && discoveryContent) {
    const item: SearchIndexItem = {
      title: safeText(article.t),
      url,
      category: safeText(article.c),
      date: safeText(article.d),
      number: Number.isFinite(article.n) ? article.n : 0,
      image: safeText(article.img) || undefined,
      kind: 'image',
      mid: safeText(article.mid) || undefined,
      idx: Number.isFinite(article.idx) ? article.idx : undefined,
      content: discoveryContent,
      fallback: false,
      source: 'wechat-fulltext',
      cachedAt: existing?.content === discoveryContent ? existing.cachedAt : new Date().toISOString(),
    };
    return { item, status: existing?.content === discoveryContent ? 'cached' : 'fetched' };
  }

  if (!force && existing && !existing.fallback && existing.content) {
    return {
      item: {
        ...existing,
        title: safeText(article.t) || existing.title,
        url,
        category: safeText(article.c) || existing.category,
        date: safeText(article.d) || existing.date,
        number: Number.isFinite(article.n) ? article.n : existing.number,
        image: safeText(article.img) || existing.image,
        kind: article.kind || existing.kind,
        mid: safeText(article.mid) || existing.mid,
        idx: Number.isFinite(article.idx) ? article.idx : existing.idx,
      },
      status: 'cached',
    };
  }

  if (!url) {
    return { item: buildFallbackItem(article, 'missing-url'), status: 'fallback' };
  }

  try {
    const fulltext = await fetchAndExtractFulltext(url, { timeoutMs: 20_000, allowCurlFallback: true });
    const content = blocksToText(Array.isArray(fulltext.blocks) ? (fulltext.blocks as TextBlock[]) : []);

    if (content) {
      return {
        item: {
          title: fulltext.title || safeText(article.t),
          url,
          category: safeText(article.c),
          date: safeText(article.d),
          number: Number.isFinite(article.n) ? article.n : 0,
          image: safeText(article.img) || undefined,
          kind: article.kind,
          mid: safeText(article.mid) || undefined,
          idx: Number.isFinite(article.idx) ? article.idx : undefined,
          content,
          fallback: false,
          source: 'wechat-fulltext',
          cachedAt: new Date().toISOString(),
        },
        status: 'fetched',
      };
    }

    if (existing?.content) {
      return {
        item: {
          ...existing,
          title: safeText(article.t) || existing.title,
          url,
          category: safeText(article.c) || existing.category,
          date: safeText(article.d) || existing.date,
          number: Number.isFinite(article.n) ? article.n : existing.number,
          image: safeText(article.img) || existing.image,
          cachedAt: new Date().toISOString(),
          error: 'empty-blocks-reuse-existing',
        },
        status: 'reused',
      };
    }

    return { item: buildFallbackItem(article, 'empty-blocks'), status: 'fallback' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (existing?.content) {
      return {
        item: {
          ...existing,
          title: safeText(article.t) || existing.title,
          url,
          category: safeText(article.c) || existing.category,
          date: safeText(article.d) || existing.date,
          number: Number.isFinite(article.n) ? article.n : existing.number,
          image: safeText(article.img) || existing.image,
          cachedAt: new Date().toISOString(),
          error: message,
        },
        status: 'reused',
      };
    }

    return { item: buildFallbackItem(article, message), status: 'fallback' };
  }
}

async function runWithConcurrency<T, R>(
  list: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(list.length);
  let nextIndex = 0;

  async function runner() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= list.length) return;
      results[current] = await worker(list[current], current);
    }
  }

  const workers: Promise<void>[] = [];
  const size = Math.min(Math.max(concurrency, 1), Math.max(list.length, 1));
  for (let i = 0; i < size; i += 1) {
    workers.push(runner());
  }

  await Promise.all(workers);
  return results;
}

function buildMonths(articles: PersonalArticle[]): [string, number][] {
  const months = new Map<string, number>();
  for (const article of articles) {
    const month = safeText(article.d).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    months.set(month, (months.get(month) || 0) + 1);
  }
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b));
}

async function writeOutput(searchIndex: SearchIndexFile) {
  const versionTag = buildVersionTag(searchIndex.updatedAt);
  const articlesFile: PersonalArticlesFile = {
    updatedAt: searchIndex.updatedAt,
    total: searchIndex.total,
    items: searchIndex.items.map((item) => ({
      t: item.title,
      d: item.date,
      u: item.url,
      c: item.category,
      n: item.number,
      img: item.image,
      kind: item.kind,
      mid: item.mid,
      idx: item.idx,
    })),
  };
  const rawHtml = await readFile(personalIndexPath, 'utf8');
  const articlesJson = JSON.stringify(articlesFile.items);
  const monthsJson = JSON.stringify(buildMonths(articlesFile.items));
  const embeddedDataPattern = /const ARTS\s*=\s*\[[\s\S]*?\];\s*const MONTHS\s*=\s*\[[\s\S]*?\];/;
  if (!embeddedDataPattern.test(rawHtml)) {
    throw new Error(`failed-to-update-embedded-articles in ${personalIndexPath}`);
  }
  const nextHtml = rawHtml
    .replace(
      embeddedDataPattern,
      `const ARTS = ${articlesJson};\nconst MONTHS = ${monthsJson};`,
    )
    .replace(/search-index\.json\?v=\d{8,14}/g, `search-index.json?v=${versionTag}`)
    .replace(/search-index\.js\?v=\d{8,14}/g, `search-index.js?v=${versionTag}`);

  await mkdir(path.dirname(searchIndexOutputPath), { recursive: true });
  await mkdir(path.dirname(personalArticlesPath), { recursive: true });
  const serialized = JSON.stringify(searchIndex, null, 2);
  await Promise.all([
    writeFile(personalArticlesPath, `${JSON.stringify(articlesFile, null, 2)}\n`, 'utf8'),
    writeFile(personalIndexPath, nextHtml, 'utf8'),
    writeFile(searchIndexOutputPath, serialized, 'utf8'),
    writeFile(searchIndexScriptOutputPath, `window.__PERSONAL_SEARCH_INDEX__ = ${serialized};\n`, 'utf8'),
  ]);
}

async function main() {
  const { force, limit, concurrency } = parseArgs();
  const articles = await localizeWechatCoverImages((await readArticles()).slice(0, limit));
  const existingMap = await loadExisting();

  let fetched = 0;
  let fallback = 0;
  let reused = 0;
  let cached = 0;

  console.log(`[personal-fulltext] start total=${articles.length} force=${force} concurrency=${concurrency}`);

  const items = await runWithConcurrency(articles, concurrency, async (article, index) => {
    const { item, status } = await buildItem(article, existingMap, force);

    if (status === 'fetched') fetched += 1;
    if (status === 'fallback') fallback += 1;
    if (status === 'reused') reused += 1;
    if (status === 'cached') cached += 1;

    console.log(`[personal-fulltext] ${index + 1}/${articles.length} ${article.u} -> ${status}`);
    return item;
  });

  const searchIndex: SearchIndexFile = {
    updatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };

  await writeOutput(searchIndex);

  console.log(`[personal-fulltext] done search=${searchIndexOutputPath}`);
  console.log(`[personal-fulltext] done script=${searchIndexScriptOutputPath}`);
  console.log(`[personal-fulltext] summary fetched=${fetched} cached=${cached} reused=${reused} fallback=${fallback}`);
}

main().catch((error) => {
  console.error('[personal-fulltext] failed:', error);
  process.exit(1);
});
