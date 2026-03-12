import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

type ExtractedEventDraft = {
  title: string;
  summary: string;
  sourceUrl: string;
  organizer: string;
  author: string;
  eventDate: string;
  deadline: string;
  location: string;
  sourceLabel: string;
  tags: string[];
  coverImage: string;
  ocrText?: string;
};

const WECHAT_HOSTNAMES = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);
const NOISY_SUFFIXES = ['向上滑动看下', '阅读全文', '点击查看', '扫码报名', '扫码查看', '了解详情', '一个', '知道了'];
const OCR_LANG = 'chi_sim';
const OCR_TIMEOUT_MS = 12000;
const OCR_CACHE_PATH = '/tmp/ka21-events-tesseract';

function cleanText(value: string) {
  return value
    .replace(/\\x0a|\\n|\\r/g, ' ')
    .replace(/\\x26quot;|&quot;/g, '"')
    .replace(/\\x26amp;|&amp;/g, '&')
    .replace(/\\x26lt;|&lt;/g, '<')
    .replace(/\\x26gt;|&gt;/g, '>')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trim()}...` : value;
}

function stripNoisySuffixes(value: string) {
  let next = cleanText(value);
  for (const suffix of NOISY_SUFFIXES) {
    next = next.replace(new RegExp(`${suffix}.*$`), '').trim();
    next = next.replace(new RegExp(`${suffix}$`), '').trim();
  }
  return next;
}

function matchText(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return cleanText(match?.[1] || '');
}

function normalizeUrl(raw: string, base: URL) {
  if (!raw) return '';
  if (raw.startsWith('//')) return `https:${raw}`;
  try {
    return new URL(raw, base).toString();
  } catch {
    return '';
  }
}

function extractPublishDate(html: string, $: cheerio.CheerioAPI) {
  const ctMatch = html.match(/var\s+ct\s*=\s*["']?(\d+)["']?/);
  if (ctMatch?.[1]) {
    const timestamp = Number(ctMatch[1]);
    if (!Number.isNaN(timestamp)) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(timestamp * 1000));
    }
  }

  const published =
    matchText(html, /var\s+publish_time\s*=\s*["']([^"']+)["']/) ||
    cleanText($('#publish_time').text()) ||
    cleanText($('meta[property="article:published_time"]').attr('content') || '');

  const normalized = published.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!normalized) return '';
  return `${normalized[1]}-${normalized[2].padStart(2, '0')}-${normalized[3].padStart(2, '0')}`;
}

function extractBodyText(html: string, $: cheerio.CheerioAPI) {
  const candidates = [
    $('#js_content').first(),
    $('.rich_media_content').first(),
    $('article').first(),
    $('main').first(),
    $('body').first(),
  ];
  const root = candidates.find((item) => item.length > 0) || $('body').first();

  root.find('script, style, noscript, iframe').remove();
  return cleanText(root.text());
}

function pickFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = stripNoisySuffixes(match?.[1] || match?.[0] || '');
    if (value) return value;
  }
  return '';
}

function inferOrganizer(text: string) {
  const organizer = pickFirstMatch(text, [
    /(?:主办方|主办单位|主办|发起方|发起单位|发起|举办方|举办单位|承办方|承办单位|联合主办|出品方|出品)[：: ]*([^\n。；]{2,40})/,
    /([^\n。；]{2,30})(?:主办|承办|发起|联合主办|出品)/,
  ]);
  if (organizer) return organizer;

  return '';
}

function inferLocation(text: string) {
  return pickFirstMatch(text, [
    /(?:活动地点|举办地点|比赛地点|赛事地点|地点|地址|举办形式|活动形式)[：: ]*([^\n。；]{2,40})/,
    /(线上直播|线上路演|线上参与|线上报名|线上|线下|混合赛制|混合|全国可参加|全球可参加)/,
    /((?:北京|上海|广州|深圳|杭州|成都|武汉|西安|重庆|南京|苏州|厦门|长沙|天津|青岛)[^，。；\n]{0,18})/,
  ]);
}

function inferDateLike(text: string, keywords: string[]) {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}[：: ]*([^。；\\n]{0,50}(?:\\d{4}[./-]\\d{1,2}[./-]\\d{1,2}|\\d{1,2}月\\d{1,2}日|即日起至)[^。；\\n]{0,30})`);
    const match = text.match(pattern);
    if (match?.[1]) return stripNoisySuffixes(match[1]);
  }

  const generic =
    text.match(/((?:即日起至|截止至|报名截止至)[^。；\n]{0,30}(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}月\d{1,2}日))/) ||
    text.match(/(\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:\s*[-至到~]\s*\d{4}[./-]\d{1,2}[./-]\d{1,2})?)/) ||
    text.match(/(\d{1,2}月\d{1,2}日(?:\s*[-至到~]\s*\d{1,2}月\d{1,2}日)?)/);
  return stripNoisySuffixes(generic?.[1] || '');
}

function inferTags(title: string, text: string) {
  const source = `${title} ${text}`;
  const mapping: Array<[RegExp, string]> = [
    [/AI|人工智能|AIGC/i, 'AI'],
    [/设计|海报|视觉|品牌/i, '设计'],
    [/视频|短片|动画|剪辑/i, '视频'],
    [/编程|代码|开发|黑客松/i, '编程'],
    [/PPT|演示|路演/i, 'PPT'],
    [/创作|创意|生成/i, '创作'],
    [/比赛|赛事|挑战赛|征集|大赛/i, '赛事'],
    [/校园|高校|大学生/i, '校园'],
  ];

  const tags = mapping.filter(([pattern]) => pattern.test(source)).map(([, tag]) => tag);
  return Array.from(new Set(tags)).slice(0, 6);
}

function buildSummary(text: string, title: string) {
  const stripped = cleanText(text.replace(title, ''));
  const sentences = stripped.match(/[^。！？!?\n]{8,80}[。！？!?]?/g) || [];
  const selected = sentences.slice(0, 3).join(' ');
  return truncate(cleanText(selected || stripped || title), 180);
}

function detectBlockedWechatPage(html: string) {
  return html.includes('环境异常') && html.includes('完成验证后即可继续访问');
}

async function extractTextFromImage(imageUrl: string) {
  if (!imageUrl) return '';

  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      Referer: 'https://mp.weixin.qq.com/',
    },
    cache: 'no-store',
  });

  if (!response.ok) return '';

  const arrayBuffer = await response.arrayBuffer();
  const input = Buffer.from(arrayBuffer);
  const prepared = await sharp(input)
    .grayscale()
    .normalize()
    .sharpen()
    .resize({ width: 1800, withoutEnlargement: true })
    .png()
    .toBuffer();

  const worker = await createWorker(OCR_LANG, 1, {
    cachePath: OCR_CACHE_PATH,
    cacheMethod: 'refresh',
  });
  try {
    const result = await Promise.race([
      worker.recognize(prepared),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('ocr-timeout')), OCR_TIMEOUT_MS);
      }),
    ]);
    return cleanText(result.data.text || '');
  } catch {
    return '';
  } finally {
    await worker.terminate();
  }
}

async function fetchText(url: string) {
  const response = await fetch(url, {
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

  return {
    finalUrl: response.url || url,
    text: await response.text(),
  };
}

async function fetchViaJina(target: URL) {
  const mirrorUrl = `https://r.jina.ai/http://${target.host}${target.pathname}${target.search}`;
  const response = await fetch(mirrorUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`mirror-status-${response.status}`);
  }
  return await response.text();
}

export async function extractEventFromSourceUrl(sourceUrl: string): Promise<ExtractedEventDraft> {
  let target: URL;
  try {
    target = new URL(sourceUrl.trim());
  } catch {
    throw new Error('invalid-source-url');
  }

  const directFetch = await fetchText(target.toString());
  const html = directFetch.text;

  if (WECHAT_HOSTNAMES.has(target.hostname) && detectBlockedWechatPage(html)) {
    try {
      const mirrorText = await fetchViaJina(target);
      const title =
        cleanText((mirrorText.split('\n').find((line) => cleanText(line).length > 0) || '')).replace(/^Title:\s*/i, '') ||
        '公众号赛事帖';
      const normalizedMirrorText = cleanText(mirrorText);
      const coverImage = '';
      const summary = buildSummary(normalizedMirrorText, title);
      const organizer = inferOrganizer(normalizedMirrorText);
      const eventDate = inferDateLike(normalizedMirrorText, ['活动时间', '比赛时间', '赛事时间', '举办时间', '时间']);
      const deadline = inferDateLike(normalizedMirrorText, ['报名截止', '截止时间', '征集截止', '投稿截止', '报名时间', '报名截止时间', '截止日期']);
      const location = inferLocation(normalizedMirrorText);
      return {
        title,
        summary,
        sourceUrl: target.toString(),
        organizer,
        author: '',
        eventDate,
        deadline,
        location,
        sourceLabel: '公众号',
        tags: inferTags(title, normalizedMirrorText),
        coverImage,
      };
    } catch {
      throw new Error('wechat-verification-required');
    }
  }

  const finalUrl = new URL(directFetch.finalUrl);
  const $ = cheerio.load(html);
  const title = cleanText(
    $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('#activity-name').text() ||
      $('.rich_media_title').text() ||
      $('title').text() ||
      matchText(html, /var\s+msg_title\s*=\s*["']([^"']+)["']/)
  );
  const author = cleanText(
    $('meta[name="author"]').attr('content') ||
      $('#js_name').text() ||
      $('a#js_name').text() ||
      matchText(html, /var\s+nickname\s*=\s*["']([^"']+)["']/)
  );
  const coverImage = normalizeUrl(
    $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      matchText(html, /var\s+msg_cdn_url\s*=\s*["']([^"']+)["']/) ||
      $('#js_content img').first().attr('data-src') ||
      $('#js_content img').first().attr('src') ||
      $('.rich_media_content img').first().attr('data-src') ||
      $('.rich_media_content img').first().attr('src') ||
      '',
    finalUrl
  );
  const bodyText = extractBodyText(html, $);
  const metaSummary = cleanText(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      matchText(html, /var\s+msg_desc\s*=\s*["']([^"']+)["']/)
  );
  const summary = buildSummary(metaSummary || bodyText, title);
  const publishDate = extractPublishDate(html, $);

  if (!title) {
    throw new Error('extract-title-failed');
  }

  let organizer = inferOrganizer(bodyText) || author;
  let eventDate = inferDateLike(bodyText, ['活动时间', '比赛时间', '赛事时间', '举办时间', '时间']) || publishDate;
  let deadline = inferDateLike(bodyText, ['报名截止', '截止时间', '征集截止', '投稿截止', '报名时间', '报名截止时间', '截止日期']);
  let location = inferLocation(bodyText);
  let ocrText = '';

  const needsPosterOcr = Boolean(coverImage) && (!deadline || !location || !organizer);
  if (needsPosterOcr) {
    ocrText = await extractTextFromImage(coverImage);
    if (ocrText) {
      organizer = organizer || inferOrganizer(ocrText);
      eventDate = eventDate || inferDateLike(ocrText, ['活动时间', '比赛时间', '赛事时间', '举办时间', '时间']);
      deadline = deadline || inferDateLike(ocrText, ['报名截止', '截止时间', '征集截止', '投稿截止', '报名时间', '报名截止时间', '截止日期']);
      location = location || inferLocation(ocrText);
    }
  }

  return {
    title,
    summary,
    sourceUrl: target.toString(),
    organizer,
    author: '',
    eventDate,
    deadline,
    location,
    sourceLabel: WECHAT_HOSTNAMES.has(target.hostname) ? '公众号' : finalUrl.hostname.replace(/^www\./, ''),
    tags: inferTags(title, bodyText),
    coverImage,
    ocrText,
  };
}
