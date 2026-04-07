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

const rootDir = path.resolve(__dirname, '..');
const personalIndexPath = path.join(rootDir, 'public', 'personal-site', 'index.html');
const personalArticlesPath = path.join(rootDir, 'data', 'personal-site', 'articles.json');
const searchIndexOutputPath = path.join(rootDir, 'public', 'personal-site', 'search-index.json');

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
  const url = safeText(article.u).trim();
  const existing = existingMap.get(url);

  if (!force && existing && !existing.fallback && existing.content) {
    return { item: existing, status: 'cached' };
  }

  if (!url) {
    return { item: buildFallbackItem(article, 'missing-url'), status: 'fallback' };
  }

  try {
    const fulltext = await fetchAndExtractFulltext(url, { timeoutMs: 20_000 });
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

async function writeOutput(searchIndex: SearchIndexFile) {
  await mkdir(path.dirname(searchIndexOutputPath), { recursive: true });
  await writeFile(searchIndexOutputPath, JSON.stringify(searchIndex, null, 2), 'utf8');
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
  console.log(`[personal-fulltext] summary fetched=${fetched} cached=${cached} reused=${reused} fallback=${fallback}`);
}

main().catch((error) => {
  console.error('[personal-fulltext] failed:', error);
  process.exit(1);
});
