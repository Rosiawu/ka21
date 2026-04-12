import { NextResponse } from 'next/server';
const EXACT_ALLOWED_HOSTS = new Set([
  'res.wx.qq.com',
]);
const WECHAT_IMAGE_FETCH_TIMEOUT_MS = 15_000;

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isAllowedWechatImageHost(hostname: string): boolean {
  return hostname === 'qpic.cn' || hostname.endsWith('.qpic.cn') || EXACT_ALLOWED_HOSTS.has(hostname);
}

function getAllowedUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return isAllowedWechatImageHost(parsed.hostname) ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchWechatImage(targetUrl: URL) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WECHAT_IMAGE_FETCH_TIMEOUT_MS);

  try {
    return await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger',
        Referer: 'https://mp.weixin.qq.com/',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      cache: 'force-cache',
      next: { revalidate: 86400 },
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = safeText(searchParams.get('url')).trim();

  if (!targetUrl) {
    return NextResponse.json({ success: false, message: 'missing-url' }, { status: 400 });
  }

  const allowedUrl = getAllowedUrl(targetUrl);
  if (!allowedUrl) {
    return NextResponse.json({ success: false, message: 'invalid-url' }, { status: 400 });
  }

  try {
    const upstream = await fetchWechatImage(allowedUrl);

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, message: `upstream-${upstream.status || 500}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'invalid-content-type' },
        { status: 502 },
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    headers.set('X-Source-Host', allowedUrl.hostname);

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
