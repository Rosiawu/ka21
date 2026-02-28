import * as cheerio from 'cheerio';

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

  return blocks
    .filter((block) => {
      if (block.type === 'image') return true;
      return normalizeText(block.text).length > 1;
    })
    .slice(0, 500);
}

export async function fetchAndExtractFulltext(
  sourceUrl: string,
  options?: { timeoutMs?: number },
): Promise<{ blocks: ContentBlock[]; finalUrl: string; title: string }> {
  const timeoutMs = options?.timeoutMs ?? 20_000;
  const target = new URL(sourceUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
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

    if (!response.ok) {
      throw new Error(`upstream-status-${response.status}`);
    }

    const html = await response.text();
    const finalUrl = response.url || target.toString();
    const finalUrlObj = new URL(finalUrl);
    const blocks = extractBlocksFromHtml(html, finalUrlObj);

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
    };
  } finally {
    clearTimeout(timer);
  }
}
