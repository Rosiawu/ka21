import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { fetchAndExtractFulltext, normalizeText, safeText } from '../src/lib/miniapp/tutorial-fulltext';

type PersonalArticle = {
  t: string;
  d: string;
  u: string;
  c: string;
  n: number;
  img?: string;
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
  src?: string;
};

const rootDir = path.resolve(__dirname, '..');
const personalIndexPath = path.join(rootDir, 'public', 'personal-site', 'index.html');
const personalArticlesPath = path.join(rootDir, 'data', 'personal-site', 'articles.json');
const personalCoversDir = path.join(rootDir, 'public', 'personal-site', 'covers');
const searchIndexOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.json');
const searchIndexScriptOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.js');
const MAX_COVER_BYTES = 8 * 1024 * 1024;
const IMAGE_REQUEST_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
  referer: 'https://mp.weixin.qq.com/',
  pragma: 'no-cache',
  'cache-control': 'no-cache',
} as const;

function parseArgs() {
  const args = process.argv.slice(2);
  let force = false;
  let limit = Number.POSITIVE_INFINITY;
  let recent = 0;
  let concurrency = Number(process.env.FULLTEXT_CONCURRENCY || '4');
  const mids = new Set<string>();

  for (const arg of args) {
    if (arg === '--force') force = true;
    if (arg.startsWith('--limit=')) {
      const n = Number(arg.slice('--limit='.length));
      if (Number.isFinite(n) && n > 0) limit = n;
    }
    if (arg.startsWith('--recent=')) {
      const n = Number(arg.slice('--recent='.length));
      if (Number.isFinite(n) && n > 0) recent = n;
    }
    if (arg.startsWith('--concurrency=')) {
      const n = Number(arg.slice('--concurrency='.length));
      if (Number.isFinite(n) && n > 0) concurrency = n;
    }
    if (arg.startsWith('--mids=')) {
      const values = arg
        .slice('--mids='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      for (const value of values) {
        mids.add(value);
      }
    }
  }

  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    concurrency = 4;
  }

  return { force, limit, recent, concurrency, mids };
}

function parseEmbeddedArticles(rawHtml: string): PersonalArticle[] {
  const match = rawHtml.match(/const ARTS\s*=\s*(\[[\s\S]*?\]);\s*const MONTHS/);
  if (!match?.[1]) {
    throw new Error(`failed-to-extract-arts-array from ${personalIndexPath}`);
  }

  const parsed = JSON.parse(match[1]) as PersonalArticle[];
  return parsed.filter((item) => !!item?.u && !!item?.t);
}

async function readArticles(): Promise<PersonalArticle[]> {
  try {
    const raw = await readFile(personalArticlesPath, 'utf8');
    const parsed = JSON.parse(raw) as PersonalArticlesFile;
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items.filter((item) => !!item?.u && !!item?.t);
    }
  } catch {
    // Fall back to embedded data below.
  }

  const rawHtml = await readFile(personalIndexPath, 'utf8');
  return parseEmbeddedArticles(rawHtml);
}

async function loadExisting(): Promise<Map<string, SearchIndexItem>> {
  try {
    const raw = await readFile(searchIndexOutputPath, 'utf8');
    const parsed = JSON.parse(raw) as SearchIndexFile;
    const map = new Map<string, SearchIndexItem>();

    for (const item of parsed.items || []) {
      if (item?.url) {
        map.set(item.url, item);
      }
    }

    return map;
  } catch {
    return new Map();
  }
}

function articleMid(article: PersonalArticle): string {
  return safeText(article.u).match(/(?:^|[?&])mid=(\d+)/)?.[1] || '';
}

function selectArticles(
  articles: PersonalArticle[],
  options: { limit: number; recent: number; mids: Set<string> },
): PersonalArticle[] {
  if (options.mids.size > 0) {
    return articles.filter((article) => options.mids.has(articleMid(article)));
  }
  if (options.recent > 0) {
    return articles.slice(-options.recent);
  }
  return articles.slice(0, options.limit);
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

function firstImageSrc(blocks: TextBlock[]): string {
  const hit = blocks.find((block) => block && block.type === 'image' && typeof block.src === 'string' && block.src.trim());
  return hit?.src?.trim() || '';
}

function inferExtension(url: string, contentType: string | null): string {
  if (contentType) {
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('webp')) return '.webp';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('gif')) return '.gif';
  }
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.gif')) return '.gif';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return '.jpg';
  return '.jpg';
}

function isRemoteImageRef(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

async function downloadCoverToLocal(coverUrl: string): Promise<string | null> {
  const normalizedUrl = safeText(coverUrl).trim().replace(/&amp;/g, '&');
  if (!normalizedUrl) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    await mkdir(personalCoversDir, { recursive: true });
    const response = await fetch(normalizedUrl, {
      headers: IMAGE_REQUEST_HEADERS,
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const declaredLength = Number(response.headers.get('content-length') || '0');
    if (declaredLength > MAX_COVER_BYTES) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_COVER_BYTES) return null;

    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash('md5').update(buffer).digest('hex').slice(0, 12);
    const ext = inferExtension(normalizedUrl, contentType);
    const filename = `${hash}${ext}`;
    await writeFile(path.join(personalCoversDir, filename), buffer);
    return `covers/${filename}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function localizeImageCandidates(candidates: string[]): Promise<string> {
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const value = safeText(candidate).trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);

    if (!isRemoteImageRef(value)) {
      return value;
    }

    const localized = await downloadCoverToLocal(value);
    if (localized) return localized;
  }

  return '';
}

function buildFallbackItem(article: PersonalArticle, reason?: string): SearchIndexItem {
  const fallbackContent = normalizeText(
    [
      safeText(article.t),
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
  const url = safeText(article.u).trim();
  const existing = existingMap.get(url);
  const localCachedImage = await localizeImageCandidates([safeText(article.img), safeText(existing?.image)]);
  if (localCachedImage) {
    article.img = localCachedImage;
  }

  if (!force && existing && !existing.fallback && existing.content) {
    return {
      item: {
        ...existing,
        image: localCachedImage || existing.image,
      },
      status: 'cached',
    };
  }

  if (!url) {
    return { item: buildFallbackItem(article, 'missing-url'), status: 'fallback' };
  }

  try {
    const fulltext = await fetchAndExtractFulltext(url, { timeoutMs: 20_000 });
    const blocks = Array.isArray(fulltext.blocks) ? (fulltext.blocks as TextBlock[]) : [];
    const content = blocksToText(blocks);
    const cover = await localizeImageCandidates([
      safeText(fulltext.firstContentImage),
      firstImageSrc(blocks),
      safeText(fulltext.cover),
      safeText(article.img),
      safeText(existing?.image),
    ]);
    if (cover) {
      article.img = cover;
    }

    if (content) {
      return {
        item: {
          title: fulltext.title || safeText(article.t),
          url,
          category: safeText(article.c),
          date: safeText(article.d),
          number: Number.isFinite(article.n) ? article.n : 0,
          image: cover || undefined,
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
          image: localCachedImage || existing.image,
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
          image: localCachedImage || existing.image,
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

async function writeOutput(searchIndex: SearchIndexFile) {
  await mkdir(path.dirname(searchIndexOutputPath), { recursive: true });
  const serialized = JSON.stringify(searchIndex, null, 2);
  await Promise.all([
    writeFile(searchIndexOutputPath, serialized, 'utf8'),
    writeFile(searchIndexScriptOutputPath, `window.__PERSONAL_SEARCH_INDEX__ = ${serialized};\n`, 'utf8'),
  ]);
}

async function writeEmbeddedArticles(articles: PersonalArticle[]) {
  const rawHtml = await readFile(personalIndexPath, 'utf8');
  const nextHtml = rawHtml.replace(
    /const ARTS\s*=\s*(\[[\s\S]*?\]);\s*const MONTHS/,
    `const ARTS = ${JSON.stringify(articles)};\nconst MONTHS`,
  );

  await writeFile(personalIndexPath, nextHtml, 'utf8');
}

async function main() {
  const { force, limit, recent, concurrency, mids } = parseArgs();
  const articles = await readArticles();
  const selectedArticles = selectArticles(articles, { limit, recent, mids });
  const existingMap = await loadExisting();
  const processedMap = new Map<string, SearchIndexItem>();

  let fetched = 0;
  let fallback = 0;
  let reused = 0;
  let cached = 0;

  console.log(
    `[personal-fulltext] start total=${articles.length} selected=${selectedArticles.length} force=${force} concurrency=${concurrency}`,
  );

  await runWithConcurrency(selectedArticles, concurrency, async (article, index) => {
    const { item, status } = await buildItem(article, existingMap, force);
    processedMap.set(item.url, item);

    if (status === 'fetched') fetched += 1;
    if (status === 'fallback') fallback += 1;
    if (status === 'reused') reused += 1;
    if (status === 'cached') cached += 1;

    console.log(`[personal-fulltext] ${index + 1}/${selectedArticles.length} ${article.u} -> ${status}`);
    return null;
  });

  const items = articles.map((article) => {
    const url = safeText(article.u).trim();
    return processedMap.get(url) || existingMap.get(url) || buildFallbackItem(article, 'not-processed');
  });

  const searchIndex: SearchIndexFile = {
    updatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };

  await Promise.all([writeOutput(searchIndex), writeEmbeddedArticles(articles)]);

  console.log(`[personal-fulltext] done search=${searchIndexOutputPath}`);
  console.log(`[personal-fulltext] done script=${searchIndexScriptOutputPath}`);
  console.log(`[personal-fulltext] done index=${personalIndexPath}`);
  console.log(`[personal-fulltext] summary fetched=${fetched} cached=${cached} reused=${reused} fallback=${fallback}`);
}

main().catch((error) => {
  console.error('[personal-fulltext] failed:', error);
  process.exit(1);
});
