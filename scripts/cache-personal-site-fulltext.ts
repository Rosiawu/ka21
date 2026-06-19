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

const rootDir = path.resolve(__dirname, '..');
const personalIndexPath = path.join(rootDir, 'public', 'personal-site', 'index.html');
const personalArticlesPath = path.join(rootDir, 'data', 'personal-site', 'articles.json');
const searchIndexOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.json');
const searchIndexScriptOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.js');
const wechatHosts = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);
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
  };
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

async function mergeAlbumArticles(articles: PersonalArticle[]): Promise<PersonalArticle[]> {
  const map = new Map<string, PersonalArticle>();

  for (const article of articles) {
    if (article.u) map.set(article.u, article);
  }

  let discovered = 0;
  let added = 0;

  for (const source of wechatAlbumSources) {
    const albumArticles = await fetchAlbumArticles(source);
    discovered += albumArticles.length;

    for (const article of albumArticles) {
      if (!article.u || map.has(article.u)) continue;
      map.set(article.u, article);
      added += 1;
    }
  }

  const merged = [...map.values()].sort(compareArticleDates);
  console.log(`[personal-fulltext] albums discovered=${discovered} added=${added} total=${merged.length}`);
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
      return mergeAlbumArticles(articles);
    }
  } catch {
    // Fall back to embedded data below.
  }

  const rawHtml = await readFile(personalIndexPath, 'utf8');
  articles = parseEmbeddedArticles(rawHtml);
  return mergeAlbumArticles(articles);
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
  const url = canonicalizeArticleUrl(article.u);
  const existing = existingMap.get(url);

  if (!force && existing && !existing.fallback && existing.content) {
    return { item: existing, status: 'cached' };
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
  const articles = (await readArticles()).slice(0, limit);
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
