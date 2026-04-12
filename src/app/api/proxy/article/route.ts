import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as cheerio from 'cheerio';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { safeFetch } from '@/lib/security/safe-fetch';
import { requireTutorialImportAccess } from '@/lib/security/tutorial-access';

interface WechatMetadata {
  title: string;
  author: string;
  publishDate: string;
  summary: string;
  cover: string;
}

const WECHAT_HOSTNAMES = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);
const execFileAsync = promisify(execFile);

const extractByRegex = (html: string, pattern: RegExp): string | undefined => {
  const match = html.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
};

// Helper to clean decoded HTML entities if needed, though cheerio handles most
const cleanText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

const parseWechatHtml = (html: string): Partial<WechatMetadata> => {
  const $ = cheerio.load(html);
  
  // 1. Extract Title
  const title = 
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('#activity-name').text() ||
    $('.rich_media_title').text() ||
    extractByRegex(html, /var\s+msg_title\s*=\s*["']([^"']*)["']/) ||
    '';
    
  // 2. Extract Author
  const author = 
    $('meta[name="author"]').attr('content') ||
    $('#js_name').text() || // 公众号名称
    $('.rich_media_meta_text').first().text() || 
    extractByRegex(html, /var\s+msg_author\s*=\s*["']([^"']*)["']/) ||
    extractByRegex(html, /var\s+nickname\s*=\s*["']([^"']*)["']/) || // 公众号昵称
    $('a#js_name').text() ||
    '';

  // 3. Extract Summary/Description
  const summary = 
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    extractByRegex(html, /var\s+msg_desc\s*=\s*["']([^"']*)["']/) ||
    $('.rich_media_content').text().substring(0, 200) || // Fallback to content snippet
    '';

  // 4. Extract Cover Image
  const cover = 
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    extractByRegex(html, /var\s+msg_cdn_url\s*=\s*["']([^"']*)["']/) ||
    '';

  // 5. Extract Publish Date
  // WeChat often puts date in a script variable 'ct' (creation time timestamp) or 'publish_time'
  // Or it's rendered in #publish_time
  let publishDate = '';
  
  // Try to find 'ct' variable (timestamp)
  const ctMatch = html.match(/var\s+ct\s*=\s*["']?(\d+)["']?/);
  if (ctMatch && ctMatch[1]) {
    const timestamp = parseInt(ctMatch[1], 10);
    if (!isNaN(timestamp)) {
      // 强制转换为北京时间 (UTC+8)
      const date = new Date(timestamp * 1000);
      const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA 输出 YYYY-MM-DD
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      publishDate = formatter.format(date);
    }
  }

  if (!publishDate) {
    // Try regex for publish_time
    const publishTimeStr = extractByRegex(html, /var\s+publish_time\s*=\s*["']([^"']*)["']/);
    if (publishTimeStr) {
      publishDate = publishTimeStr;
    }
  }
  
  if (!publishDate) {
    // Try DOM
    const dateText = $('#publish_time').text();
    if (dateText) publishDate = dateText;
  }

  return {
    title: cleanText(title),
    author: cleanText(author),
    publishDate: publishDate,
    summary: cleanText(summary),
    cover: cover.trim(),
  };
};

const buildWechatRequestHeaders = () => ({
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Referer': 'https://mp.weixin.qq.com/',
  'Cache-Control': 'max-age=0',
});

function shouldUseCurlFallback(error: unknown) {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('unresolved-remote-host')
  );
}

async function fetchWechatHtmlWithCurl(url: string) {
  const headers = buildWechatRequestHeaders();
  const args = [
    '-L',
    '-sS',
    '--max-time',
    '12',
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

export async function GET(request: Request) {
  const tutorialAccessError = requireTutorialImportAccess(request);
  if (tutorialAccessError) {
    return tutorialAccessError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'wechat-article-proxy',
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url')?.trim().slice(0, 1000) || '';

  if (!url) {
    return NextResponse.json(
      { success: false, message: '缺少 url 参数' },
      { status: 400 },
    );
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json(
      { success: false, message: '无效的链接地址' },
      { status: 400 },
    );
  }

  if (!WECHAT_HOSTNAMES.has(target.hostname)) {
    return NextResponse.json(
      { success: false, message: '目前仅支持微信公众号文章链接' },
      { status: 400 },
    );
  }

  try {
    let html = '';

    try {
      const res = await safeFetch(target.toString(), {
        headers: buildWechatRequestHeaders(),
      }, {
        allowedHostnames: WECHAT_HOSTNAMES,
        timeoutMs: 12_000,
      });

      if (!res.ok) {
        return NextResponse.json(
          { success: false, message: `抓取失败，状态码 ${res.status}` },
          { status: 502 },
        );
      }

      html = await res.text();
    } catch (fetchError) {
      if (!shouldUseCurlFallback(fetchError)) {
        throw fetchError;
      }

      html = await fetchWechatHtmlWithCurl(target.toString());
    }
    const meta = parseWechatHtml(html);

    if (!meta.title) {
      return NextResponse.json(
        { success: false, message: '未能从页面中解析出文章信息，可能是因为微信反爬虫限制' },
        { status: 500 },
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const data: WechatMetadata = {
      title: meta.title || '',
      author: meta.author || '',
      publishDate: meta.publishDate || today,
      summary: meta.summary || meta.title || '',
      cover: meta.cover || '',
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '抓取或解析微信公众号文章时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}
