import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import tutorialsData from '../src/data/tutorials.json';
import {
  buildFallbackBlocks,
  fetchAndExtractFulltext,
  safeText,
  type FulltextCacheFile,
  type FulltextCacheItem,
  type TutorialRecord,
} from '../src/lib/miniapp/tutorial-fulltext';

const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'src', 'data', 'miniapp-tutorial-fulltext.json');

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

async function loadExisting(): Promise<Map<string, FulltextCacheItem>> {
  try {
    const raw = await readFile(outputPath, 'utf8');
    const parsed = JSON.parse(raw) as FulltextCacheFile;
    const map = new Map<string, FulltextCacheItem>();
    for (const item of parsed.items || []) {
      if (item && item.id) {
        map.set(item.id, item);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function toTutorialList(): TutorialRecord[] {
  return (((tutorialsData as { tutorials?: TutorialRecord[] }).tutorials || []) as TutorialRecord[]).filter(
    (item) => !!item && !!item.id,
  );
}

function makeFallbackItem(tutorial: TutorialRecord, reason?: string): FulltextCacheItem {
  return {
    id: tutorial.id,
    url: safeText(tutorial.url),
    title: safeText(tutorial.title),
    cover: safeText(tutorial.customImageUrl),
    blocks: buildFallbackBlocks(tutorial),
    fallback: true,
    source: 'fallback-summary',
    cachedAt: new Date().toISOString(),
    error: reason || undefined,
  };
}

async function buildItem(
  tutorial: TutorialRecord,
  existingMap: Map<string, FulltextCacheItem>,
  force: boolean,
): Promise<{ item: FulltextCacheItem; status: 'cached' | 'fetched' | 'fallback' | 'reused' }> {
  const existing = existingMap.get(tutorial.id);

  if (!force && existing && !existing.fallback && (existing.blocks || []).length > 0) {
    return { item: existing, status: 'cached' };
  }

  const url = safeText(tutorial.url).trim();
  if (!url) {
    return { item: makeFallbackItem(tutorial, 'missing-url'), status: 'fallback' };
  }

  try {
    const fulltext = await fetchAndExtractFulltext(url, { timeoutMs: 20_000 });
    const blocks = fulltext.blocks || [];

    if (blocks.length > 0) {
      return {
        item: {
          id: tutorial.id,
          url,
          title: fulltext.title || safeText(tutorial.title),
          cover: safeText(fulltext.cover) || safeText(tutorial.customImageUrl),
          blocks,
          fallback: false,
          source: 'wechat-fulltext',
          cachedAt: new Date().toISOString(),
        },
        status: 'fetched',
      };
    }

    if (existing && (existing.blocks || []).length > 0) {
      return {
        item: {
          ...existing,
          cachedAt: new Date().toISOString(),
          error: 'empty-blocks-reuse-existing',
        },
        status: 'reused',
      };
    }

    return {
      item: makeFallbackItem(tutorial, 'empty-blocks'),
      status: 'fallback',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (existing && (existing.blocks || []).length > 0) {
      return {
        item: {
          ...existing,
          cachedAt: new Date().toISOString(),
          error: message,
        },
        status: 'reused',
      };
    }

    return {
      item: makeFallbackItem(tutorial, message),
      status: 'fallback',
    };
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

async function main() {
  const { force, limit, concurrency } = parseArgs();
  const tutorials = toTutorialList().slice(0, limit);
  const existingMap = await loadExisting();

  // eslint-disable-next-line no-console
  console.log(`[fulltext-cache] start total=${tutorials.length}, force=${force}, concurrency=${concurrency}`);

  let fetched = 0;
  let fallback = 0;
  let reused = 0;
  let cached = 0;

  const outputItems = await runWithConcurrency(tutorials, concurrency, async (tutorial, index) => {
    const { item, status } = await buildItem(tutorial, existingMap, force);

    if (status === 'fetched') fetched += 1;
    if (status === 'fallback') fallback += 1;
    if (status === 'reused') reused += 1;
    if (status === 'cached') cached += 1;

    // eslint-disable-next-line no-console
    console.log(`[fulltext-cache] ${index + 1}/${tutorials.length} ${tutorial.id} -> ${status}`);
    return item;
  });

  const result: FulltextCacheFile = {
    updatedAt: new Date().toISOString(),
    total: outputItems.length,
    items: outputItems,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`[fulltext-cache] done output=${outputPath}`);
  // eslint-disable-next-line no-console
  console.log(`[fulltext-cache] summary fetched=${fetched}, cached=${cached}, reused=${reused}, fallback=${fallback}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[fulltext-cache] failed:', error);
  process.exit(1);
});
