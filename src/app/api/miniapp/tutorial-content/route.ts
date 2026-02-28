import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

import tutorialsData from '../../../../data/tutorials.json';

type TutorialRecord = {
  id: string;
  title?: string;
  url?: string;
  source?: string;
  publishDate?: string;
  difficultyLevel?: string;
  category?: string;
  description?: string;
  recommendReason?: string;
  customImageUrl?: string;
};

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; text: string }
  | { type: 'image'; src: string; alt: string };

type CachePayload = {
  title: string;
  blocks: ContentBlock[];
  fetchedAt: string;
};

const tutorials = ((tutorialsData as { tutorials?: TutorialRecord[] }).tutorials || []) as TutorialRecord[];
const WECHAT_HOSTNAMES = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE = new Map<string, { expiresAt: number; payload: CachePayload }>();

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([，。！？；：])+/g, '$1')
    .trim();
}

function splitFallbackParagraphs(text: string): string[] {
  const clean = normalizeText(text).replace(/\r/g, '\n');
  if (!clean) return [];

  const blocks = clean.split(/\n+/).map((item) => normalizeText(item)).filter(Boolean);
  const out: string[] = [];
  for (const block of blocks) {
    if (block.length <= 100) {
      out.push(block);
      continue;
    }

    const sentences = block.match(/[^。！？；]+[。！？；]?/g) || [block];
    let merged = '';
    for (const sentenceRaw of sentences) {
      const sentence = normalizeText(sentenceRaw);
      if (!sentence) continue;
      if ((merged + sentence).length > 100 && merged) {
        out.push(merged);
        merged = sentence;
      } else {
        merged += sentence;
      }
    }
    if (merged) out.push(merged);
  }

  return out;
}

function absolutizeUrl(rawUrl: string, base: URL): string {
  const url = safeText(rawUrl);
  if (!url) return '';

  if (url.startsWith('//')) return `https:${url}`;
  try {
    return new URL(url, base).toString();
  } catch {
    return '';
  }
}

function findRoot($: cheerio.CheerioAPI, targetUrl: URL): cheerio.Cheerio<any> {
  if (WECHAT_HOSTNAMES.has(targetUrl.hostname)) {
    const wxRoot = $('#js_content').first();
    if (wxRoot.length) return wxRoot;
    const richRoot = $('.rich_media_content').first();
    if (richRoot.length) return richRoot;
  }

  const candidates = ['article', 'main', '.content', '.article', '.post-content', '.wiki-content', 'body'];
  for (const selector of candidates) {
    const hit = $(selector).first();
    if (hit.length) return hit;
  }
  return $('body').first();
}

function isBlockTag(tagName: string): boolean {
  return (
    tagName === 'img' ||
    tagName === 'p' ||
    tagName === 'li' ||
    tagName === 'blockquote' ||
    tagName === 'pre' ||
    tagName === 'h1' ||
    tagName === 'h2' ||
    tagName === 'h3' ||
    tagName === 'h4' ||
    tagName === 'h5' ||
    tagName === 'h6'
  );
}

function extractBlocks(html: string, targetUrl: URL): ContentBlock[] {
  const $ = cheerio.load(html);
  const root = findRoot($, targetUrl);

  root.find('script, style, link, noscript, iframe, svg, canvas').remove();
  root.find('.rich_media_tool, .reward_area, .original_area_primary, .js_img_placeholder').remove();

  const blocks: ContentBlock[] = [];

  const push = (block: ContentBlock) => {
    const last = blocks[blocks.length - 1];
    if (!last) {
      blocks.push(block);
      return;
    }

    if (block.type === 'image' && last.type === 'image' && block.src === last.src) {
      return;
    }

    if ('text' in block && 'text' in last && block.type === last.type && block.text === last.text) {
      return;
    }

    blocks.push(block);
  };

  const walk = (node: any) => {
    if (!node || node.type !== 'tag') return;

    const tagName = (node.tagName || '').toLowerCase();
    const nodeEl = $(node);

    if (tagName === 'img') {
      const rawSrc =
        nodeEl.attr('data-src') ||
        nodeEl.attr('data-original') ||
        nodeEl.attr('src') ||
        nodeEl.attr('data-actualsrc') ||
        '';
      const src = absolutizeUrl(rawSrc, targetUrl);
      if (src) {
        push({ type: 'image', src, alt: normalizeText(nodeEl.attr('alt') || '') });
      }
      return;
    }

    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
      const text = normalizeText(nodeEl.text());
      if (text) push({ type: 'heading', text });
      return;
    }

    if (tagName === 'li') {
      const text = normalizeText(nodeEl.text());
      if (text) push({ type: 'list', text });
      return;
    }

    if (tagName === 'blockquote') {
      const text = normalizeText(nodeEl.text());
      if (text) push({ type: 'quote', text });
      return;
    }

    if (tagName === 'p' || tagName === 'pre') {
      const text = normalizeText(nodeEl.text());
      if (text) push({ type: 'paragraph', text });
      return;
    }

    if (tagName === 'div' || tagName === 'section') {
      const children = nodeEl.children().toArray();
      const hasNestedBlock = children.some((child) => child.type === 'tag' && isBlockTag((child as any).tagName || ''));
      if (!hasNestedBlock) {
        const text = normalizeText(nodeEl.text());
        if (text && text.length > 8) {
          push({ type: 'paragraph', text });
          return;
        }
      }
    }

    const children = nodeEl.contents().toArray();
    for (const child of children) {
      walk(child);
    }
  };

  for (const node of root.contents().toArray()) {
    walk(node);
  }

  const deduped = blocks.filter((block) => {
    if (block.type === 'image') return true;
    return normalizeText(block.text).length > 1;
  });

  return deduped.slice(0, 320);
}

function findTutorial(id: string, url: string): TutorialRecord | undefined {
  if (id) {
    const byId = tutorials.find((item) => item.id === id);
    if (byId) return byId;
  }
  if (url) {
    return tutorials.find((item) => safeText(item.url) === url);
  }
  return undefined;
}

function buildFallbackBlocks(tutorial: TutorialRecord): ContentBlock[] {
  const result: ContentBlock[] = [];
  const desc = splitFallbackParagraphs(safeText(tutorial.description));
  const reason = splitFallbackParagraphs(safeText(tutorial.recommendReason));
  const merged = [...desc, ...reason];

  for (const text of merged) {
    result.push({ type: 'paragraph', text });
  }

  if (!result.length) {
    result.push({ type: 'paragraph', text: '该教程暂未完成全文转换，当前显示摘要版本。' });
  }

  return result;
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
  const cacheHit = CACHE.get(cacheKey);
  if (cacheHit && cacheHit.expiresAt > Date.now()) {
    return NextResponse.json({
      success: true,
      data: {
        id: tutorial.id,
        title: tutorial.title || cacheHit.payload.title,
        author: tutorial.source || '',
        publishDate: tutorial.publishDate || '',
        category: tutorial.category || '',
        difficultyLevel: tutorial.difficultyLevel || '',
        cover: tutorial.customImageUrl || '',
        sourceUrl,
        blocks: cacheHit.payload.blocks,
        fetchedAt: cacheHit.payload.fetchedAt,
        fromCache: true,
      },
    });
  }

  try {
    const target = new URL(sourceUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(target.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Referer: 'https://mp.weixin.qq.com/',
      },
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: tutorial.id,
            title: tutorial.title || '',
            author: tutorial.source || '',
            publishDate: tutorial.publishDate || '',
            category: tutorial.category || '',
            difficultyLevel: tutorial.difficultyLevel || '',
            cover: tutorial.customImageUrl || '',
            sourceUrl,
            blocks: buildFallbackBlocks(tutorial),
            fetchedAt: new Date().toISOString(),
            fallback: true,
            reason: `upstream-status-${response.status}`,
          },
        },
        { status: 200 },
      );
    }

    const html = await response.text();
    const blocks = extractBlocks(html, target);
    const safeBlocks = blocks.length ? blocks : buildFallbackBlocks(tutorial);

    const payload: CachePayload = {
      title: tutorial.title || '',
      blocks: safeBlocks,
      fetchedAt: new Date().toISOString(),
    };

    CACHE.set(cacheKey, {
      payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tutorial.id,
        title: tutorial.title || '',
        author: tutorial.source || '',
        publishDate: tutorial.publishDate || '',
        category: tutorial.category || '',
        difficultyLevel: tutorial.difficultyLevel || '',
        cover: tutorial.customImageUrl || '',
        sourceUrl,
        blocks: safeBlocks,
        fetchedAt: payload.fetchedAt,
        fallback: blocks.length === 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        data: {
          id: tutorial.id,
          title: tutorial.title || '',
          author: tutorial.source || '',
          publishDate: tutorial.publishDate || '',
          category: tutorial.category || '',
          difficultyLevel: tutorial.difficultyLevel || '',
          cover: tutorial.customImageUrl || '',
          sourceUrl,
          blocks: buildFallbackBlocks(tutorial),
          fetchedAt: new Date().toISOString(),
          fallback: true,
          reason: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 200 },
    );
  }
}
