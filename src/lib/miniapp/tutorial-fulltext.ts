import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import * as cheerio from 'cheerio';
import { safeFetch } from '@/lib/security/safe-fetch';

export type TutorialRecord = {
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

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; text: string }
  | { type: 'image'; src: string; alt: string };

export type FulltextCacheItem = {
  id: string;
  url: string;
  title: string;
  blocks: ContentBlock[];
  cover?: string;
  fallback: boolean;
  source: 'wechat-fulltext' | 'fallback-summary' | 'runtime-fulltext';
  cachedAt: string;
  error?: string;
};

export type FulltextCacheFile = {
  updatedAt: string;
  total: number;
  items: FulltextCacheItem[];
};

const WECHAT_HOSTNAMES = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);
const execFileAsync = promisify(execFile);

function buildWechatRequestHeaders() {
  return {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Referer: 'https://mp.weixin.qq.com/',
    'Cache-Control': 'max-age=0',
  } as const;
}

function shouldUseCurlFallback(targetUrl: URL, error: unknown, allowCurlFallback: boolean) {
  if (!allowCurlFallback || !WECHAT_HOSTNAMES.has(targetUrl.hostname)) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('unresolved-remote-host') ||
    message.includes('unsafe-remote-address')
  );
}

async function fetchWechatHtmlWithCurl(url: string, timeoutMs: number) {
  const headers = buildWechatRequestHeaders();
  const args = [
    '-L',
    '-sS',
    '--max-time',
    String(Math.max(1, Math.ceil(timeoutMs / 1000))),
    '-A',
    headers['User-Agent'],
    '-H',
    `Accept: ${headers.Accept}`,
    '-H',
    `Accept-Language: ${headers['Accept-Language']}`,
    '-H',
    `Referer: ${headers.Referer}`,
    '-H',
    `Cache-Control: ${headers['Cache-Control']}`,
    '-w',
    '\n__KA21_HTTP_STATUS__:%{http_code}',
    url,
  ];

  const { stdout } = await execFileAsync('curl', args, {
    maxBuffer: 8 * 1024 * 1024,
  });

  const marker = '\n__KA21_HTTP_STATUS__:';
  const markerIndex = stdout.lastIndexOf(marker);
  if (markerIndex === -1) {
    throw new Error('curl-status-missing');
  }

  const body = stdout.slice(0, markerIndex);
  const statusCode = Number(stdout.slice(markerIndex + marker.length).trim());

  if (!Number.isFinite(statusCode) || statusCode >= 400) {
    throw new Error(`curl-fetch-failed-${statusCode || 'unknown'}`);
  }

  return body;
}

async function fetchWechatHtmlWithNativeFetch(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: buildWechatRequestHeaders(),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`native-fetch-failed-${response.status}`);
    }

    return {
      html: await response.text(),
      finalUrl: response.url || url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([，。！？；：])+/g, '$1')
    .trim();
}

export function splitFallbackParagraphs(text: string): string[] {
  const clean = normalizeText(text).replace(/\r/g, '\n');
  if (!clean) return [];

  const blocks = clean
    .split(/\n+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);

  const out: string[] = [];
  for (const block of blocks) {
    if (block.length <= 100) {
      out.push(block);
      continue;
    }

    const sentences = block.match(/[^。！？；]+[。！？；]?/g) || [block];
    let merged = '';
    for (const rawSentence of sentences) {
      const sentence = normalizeText(rawSentence);
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

export function buildFallbackBlocks(tutorial: TutorialRecord): ContentBlock[] {
  const desc = splitFallbackParagraphs(safeText(tutorial.description));
  const reason = splitFallbackParagraphs(safeText(tutorial.recommendReason));
  const merged = [...desc, ...reason];

  if (!merged.length) {
    return [{ type: 'paragraph', text: '该教程暂未完成全文转换，当前显示摘要版本。' }];
  }

  return merged.map((text) => ({ type: 'paragraph', text }));
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

export function extractBlocksFromHtml(html: string, targetUrl: URL): ContentBlock[] {
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

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;

    const typedNode = node as { type?: string; tagName?: string };
    if (typedNode.type !== 'tag') return;

    const tagName = (typedNode.tagName || '').toLowerCase();
    const nodeEl = $(node as never);

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
      const hasNestedBlock = children.some((child) => {
        if (!child || typeof child !== 'object') return false;
        const childNode = child as { type?: string; tagName?: string };
        return childNode.type === 'tag' && isBlockTag((childNode.tagName || '').toLowerCase());
      });

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

  const filtered = blocks
    .filter((block) => {
      if (block.type === 'image') return true;
      return normalizeText(block.text).length > 1;
    })
    .slice(0, 500);

  const hasTextBlock = filtered.some((block) => block.type !== 'image');
  if (hasTextBlock) {
    return filtered;
  }

  // Some WeChat pages wrap正文 in deeply nested inline tags; fallback to raw root text slicing.
  const plainText = normalizeText(root.text());
  const fallbackTexts = splitFallbackParagraphs(plainText).slice(0, 120);
  if (!fallbackTexts.length) {
    return filtered;
  }

  const textBlocks: ContentBlock[] = fallbackTexts.map((text) => ({ type: 'paragraph', text }));
  return [...filtered, ...textBlocks].slice(0, 500);
}

function extractCoverFromHtml(html: string, finalUrlObj: URL): string {
  const $ = cheerio.load(html);
  const fromMeta =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[itemprop="image"]').attr('content') ||
    '';
  const normalizedMeta = absolutizeUrl(fromMeta, finalUrlObj);
  if (normalizedMeta) return normalizedMeta;

  const coverMatch =
    html.match(/var\s+msg_cdn_url\s*=\s*"([^"]+)"/) ||
    html.match(/var\s+msg_cdn_url\s*=\s*'([^']+)'/);
  if (coverMatch && coverMatch[1]) {
    return absolutizeUrl(coverMatch[1], finalUrlObj);
  }

  const firstImg =
    $('#js_content img[data-src]').first().attr('data-src') ||
    $('#js_content img').first().attr('src') ||
    $('.rich_media_content img[data-src]').first().attr('data-src') ||
    $('.rich_media_content img').first().attr('src') ||
    '';
  return absolutizeUrl(firstImg, finalUrlObj);
}

export async function fetchAndExtractFulltext(
  sourceUrl: string,
  options?: { timeoutMs?: number; allowCurlFallback?: boolean },
): Promise<{ blocks: ContentBlock[]; finalUrl: string; title: string; cover: string }> {
  const timeoutMs = options?.timeoutMs ?? 20_000;
  const target = new URL(sourceUrl);
  const headers = buildWechatRequestHeaders();

  let html = '';
  let finalUrl = target.toString();

  try {
    const response = await safeFetch(target.toString(), {
      headers,
      cache: 'no-store',
    }, {
      timeoutMs,
    });

    if (!response.ok) {
      throw new Error(`upstream-status-${response.status}`);
    }

    html = await response.text();
    finalUrl = response.url || target.toString();
  } catch (error) {
    if (!shouldUseCurlFallback(target, error, options?.allowCurlFallback === true)) {
      throw error;
    }

    try {
      const nativeResult = await fetchWechatHtmlWithNativeFetch(target.toString(), timeoutMs);
      html = nativeResult.html;
      finalUrl = nativeResult.finalUrl;
    } catch {
      html = await fetchWechatHtmlWithCurl(target.toString(), timeoutMs);
    }
  }
  const finalUrlObj = new URL(finalUrl);
  const blocks = extractBlocksFromHtml(html, finalUrlObj);
  const cover = extractCoverFromHtml(html, finalUrlObj);

  const $ = cheerio.load(html);
  const title =
    normalizeText(
      $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('#activity-name').text() ||
        $('.rich_media_title').text() ||
        $('title').text() ||
        '',
    ) || '';

  return {
    blocks,
    finalUrl,
    title,
    cover,
  };
}
