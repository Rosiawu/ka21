import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface WechatMetadata {
  title: string;
  author: string;
  publishDate: string;
  summary: string;
  cover: string;
}

const WECHAT_HOSTNAMES = new Set(['mp.weixin.qq.com', 'mp.weixinqq.com']);

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
  let title = 
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('#activity-name').text() ||
    $('.rich_media_title').text() ||
    extractByRegex(html, /var\s+msg_title\s*=\s*["']([^"']*)["']/) ||
    '';
    
  // 2. Extract Author
  let author = 
    $('meta[name="author"]').attr('content') ||
    $('#js_name').text() || // 公众号名称
    $('.rich_media_meta_text').first().text() || 
    extractByRegex(html, /var\s+msg_author\s*=\s*["']([^"']*)["']/) ||
    extractByRegex(html, /var\s+nickname\s*=\s*["']([^"']*)["']/) || // 公众号昵称
    $('a#js_name').text() ||
    '';

  // 3. Extract Summary/Description
  let summary = 
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    extractByRegex(html, /var\s+msg_desc\s*=\s*["']([^"']*)["']/) ||
    $('.rich_media_content').text().substring(0, 200) || // Fallback to content snippet
    '';

  // 4. Extract Cover Image
  let cover = 
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
      const date = new Date(timestamp * 1000);
      publishDate = date.toISOString().split('T')[0];
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

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
    console.log(`Fetching WeChat URL: ${target.toString()}`);
    const res = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://mp.weixin.qq.com/',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!res.ok) {
      console.error(`WeChat fetch failed: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { success: false, message: `抓取失败，状态码 ${res.status}` },
        { status: 502 },
      );
    }

    const html = await res.text();
    console.log(`Fetched HTML length: ${html.length}`);
    
    const meta = parseWechatHtml(html);
    console.log('Parsed metadata:', JSON.stringify(meta, null, 2));

    if (!meta.title) {
      console.warn('Failed to extract title from HTML');
      // 尝试打印一部分 HTML 来调试（仅前 500 字符）
      console.log('HTML Preview:', html.substring(0, 500));
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
    console.error('Wechat metadata fetch error:', error);
    return NextResponse.json(
      { success: false, message: '抓取或解析微信公众号文章时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}

