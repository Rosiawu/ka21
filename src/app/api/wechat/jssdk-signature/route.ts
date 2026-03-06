import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenCache = {
  value: string;
  expiresAt: number;
};

let accessTokenCache: TokenCache | null = null;
let jsapiTicketCache: TokenCache | null = null;

const WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const WECHAT_TICKET_URL = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
const CACHE_BUFFER_SECONDS = 120;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function isValidCache(cache: TokenCache | null) {
  return Boolean(cache && cache.expiresAt > nowSeconds());
}

function buildNonceStr() {
  return randomBytes(8).toString('hex');
}

function sha1(value: string) {
  return createHash('sha1').update(value).digest('hex');
}

async function getAccessToken(appId: string, appSecret: string) {
  if (isValidCache(accessTokenCache)) {
    return accessTokenCache!.value;
  }

  const url =
    `${WECHAT_TOKEN_URL}?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`;
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json();

  if (!response.ok || data?.errcode || !data?.access_token) {
    throw new Error(`get-access-token-failed: ${data?.errmsg || response.statusText || 'unknown'}`);
  }

  const expiresIn = Math.max(300, Number(data.expires_in || 7200) - CACHE_BUFFER_SECONDS);
  accessTokenCache = {
    value: data.access_token,
    expiresAt: nowSeconds() + expiresIn
  };
  return accessTokenCache.value;
}

async function getJsapiTicket(accessToken: string) {
  if (isValidCache(jsapiTicketCache)) {
    return jsapiTicketCache!.value;
  }

  const url = `${WECHAT_TICKET_URL}?access_token=${encodeURIComponent(accessToken)}&type=jsapi`;
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json();

  if (!response.ok || data?.errcode !== 0 || !data?.ticket) {
    throw new Error(`get-jsapi-ticket-failed: ${data?.errmsg || response.statusText || 'unknown'}`);
  }

  const expiresIn = Math.max(300, Number(data.expires_in || 7200) - CACHE_BUFFER_SECONDS);
  jsapiTicketCache = {
    value: data.ticket,
    expiresAt: nowSeconds() + expiresIn
  };
  return jsapiTicketCache.value;
}

export async function GET(request: Request) {
  try {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { success: false, message: 'missing-wechat-env' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url') || '';
    if (!rawUrl) {
      return NextResponse.json(
        { success: false, message: 'missing-url' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { success: false, message: 'invalid-url' },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { success: false, message: 'invalid-url-protocol' },
        { status: 400 }
      );
    }

    const urlWithoutHash = rawUrl.split('#')[0];
    const accessToken = await getAccessToken(appId, appSecret);
    const jsapiTicket = await getJsapiTicket(accessToken);
    const nonceStr = buildNonceStr();
    const timestamp = nowSeconds();

    const signStr = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${urlWithoutHash}`;
    const signature = sha1(signStr);

    return NextResponse.json({
      success: true,
      data: {
        appId,
        timestamp,
        nonceStr,
        signature
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown-error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
