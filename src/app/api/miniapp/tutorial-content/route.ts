import { NextResponse } from 'next/server';

import tutorialsData from '../../../../data/tutorials.json';
import fulltextCacheData from '../../../../data/miniapp-tutorial-fulltext.json';
import {
  buildFallbackBlocks,
  fetchAndExtractFulltext,
  safeText,
  type ContentBlock,
  type FulltextCacheFile,
  type FulltextCacheItem,
  type TutorialRecord,
} from '@/lib/miniapp/tutorial-fulltext';

type RuntimeCacheEntry = {
  expiresAt: number;
  blocks: ContentBlock[];
  fetchedAt: string;
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const runtimeCache = new Map<string, RuntimeCacheEntry>();

const tutorials = ((tutorialsData as { tutorials?: TutorialRecord[] }).tutorials || []) as TutorialRecord[];
const tutorialById = new Map<string, TutorialRecord>();
for (const item of tutorials) {
  if (item?.id) tutorialById.set(item.id, item);
}

const offlineCacheItems =
  ((fulltextCacheData as FulltextCacheFile).items || []).filter((item) => item && item.id) || [];
const offlineCacheById = new Map<string, FulltextCacheItem>();
for (const item of offlineCacheItems) {
  offlineCacheById.set(item.id, item);
}

function findTutorial(id: string, url: string): TutorialRecord | undefined {
  if (id && tutorialById.has(id)) {
    return tutorialById.get(id);
  }

  if (url) {
    return tutorials.find((item) => safeText(item.url) === url);
  }

  return undefined;
}

function buildResponsePayload(params: {
  tutorial: TutorialRecord;
  sourceUrl: string;
  blocks: ContentBlock[];
  fallback: boolean;
  source: string;
  fetchedAt: string;
  reason?: string;
}) {
  const { tutorial, sourceUrl, blocks, fallback, source, fetchedAt, reason } = params;

  return {
    id: tutorial.id,
    title: tutorial.title || '',
    author: tutorial.source || '',
    publishDate: tutorial.publishDate || '',
    category: tutorial.category || '',
    difficultyLevel: tutorial.difficultyLevel || '',
    cover: tutorial.customImageUrl || '',
    sourceUrl,
    blocks,
    fallback,
    source,
    fetchedAt,
    reason: reason || '',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = safeText(searchParams.get('id')).trim();
  const urlParam = safeText(searchParams.get('url')).trim();

  const tutorial = findTutorial(id, urlParam);
  if (!tutorial) {
    return NextResponse.json({ success: false, message: '未找到对应教程' }, { status: 404 });
  }

  const sourceUrl = safeText(tutorial.url || urlParam);
  if (!sourceUrl) {
    return NextResponse.json({ success: false, message: '缺少原文链接' }, { status: 400 });
  }

  const cacheKey = tutorial.id || sourceUrl;
  const runtimeHit = runtimeCache.get(cacheKey);
  if (runtimeHit && runtimeHit.expiresAt > Date.now() && runtimeHit.blocks.length) {
    return NextResponse.json({
      success: true,
      data: buildResponsePayload({
        tutorial,
        sourceUrl,
        blocks: runtimeHit.blocks,
        fallback: false,
        source: 'runtime-memory',
        fetchedAt: runtimeHit.fetchedAt,
      }),
    });
  }

  const offlineHit = offlineCacheById.get(tutorial.id);
  const offlineBlocks = Array.isArray(offlineHit?.blocks) ? offlineHit?.blocks || [] : [];

  if (offlineHit && !offlineHit.fallback && offlineBlocks.length) {
    return NextResponse.json({
      success: true,
      data: buildResponsePayload({
        tutorial,
        sourceUrl,
        blocks: offlineBlocks,
        fallback: false,
        source: offlineHit.source || 'offline-cache',
        fetchedAt: offlineHit.cachedAt || '',
      }),
    });
  }

  try {
    const fulltext = await fetchAndExtractFulltext(sourceUrl, { timeoutMs: 20_000 });

    if (fulltext.blocks.length) {
      const fetchedAt = new Date().toISOString();
      runtimeCache.set(cacheKey, {
        blocks: fulltext.blocks,
        fetchedAt,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return NextResponse.json({
        success: true,
        data: buildResponsePayload({
          tutorial,
          sourceUrl,
          blocks: fulltext.blocks,
          fallback: false,
          source: 'runtime-fulltext',
          fetchedAt,
        }),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (offlineBlocks.length) {
      return NextResponse.json({
        success: true,
        data: buildResponsePayload({
          tutorial,
          sourceUrl,
          blocks: offlineBlocks,
          fallback: true,
          source: offlineHit?.source || 'offline-fallback',
          fetchedAt: offlineHit?.cachedAt || new Date().toISOString(),
          reason: message,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      data: buildResponsePayload({
        tutorial,
        sourceUrl,
        blocks: buildFallbackBlocks(tutorial),
        fallback: true,
        source: 'summary-fallback',
        fetchedAt: new Date().toISOString(),
        reason: message,
      }),
    });
  }

  if (offlineBlocks.length) {
    return NextResponse.json({
      success: true,
      data: buildResponsePayload({
        tutorial,
        sourceUrl,
        blocks: offlineBlocks,
        fallback: !!offlineHit?.fallback,
        source: offlineHit?.source || 'offline-cache',
        fetchedAt: offlineHit?.cachedAt || new Date().toISOString(),
      }),
    });
  }

  return NextResponse.json({
    success: true,
    data: buildResponsePayload({
      tutorial,
      sourceUrl,
      blocks: buildFallbackBlocks(tutorial),
      fallback: true,
      source: 'summary-fallback',
      fetchedAt: new Date().toISOString(),
      reason: 'empty-runtime-fulltext',
    }),
  });
}
