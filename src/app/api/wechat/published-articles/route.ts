import { NextResponse } from 'next/server';

import { requireAdminAccess } from '@/lib/security/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenCache = {
  value: string;
  expiresAt: number;
};

type PublishedArticle = {
  title: string;
  url: string;
  publishedAt: number;
};

let accessTokenCache: TokenCache | null = null;

const WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const WECHAT_PUBLISHED_URL = 'https://api.weixin.qq.com/cgi-bin/freepublish/batchget';
const CACHE_BUFFER_SECONDS = 120;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function getAccessToken(appId: string, appSecret: string) {
  if (accessTokenCache && accessTokenCache.expiresAt > nowSeconds()) {
    return accessTokenCache.value;
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
    expiresAt: nowSeconds() + expiresIn,
  };
  return accessTokenCache.value;
}

function sanitizePublishedArticles(payload: any): PublishedArticle[] {
  const items = Array.isArray(payload?.item) ? payload.item : [];

  return items.flatMap((item: any) => {
    const publishedAt = Number(item?.update_time || 0);
    const newsItems = Array.isArray(item?.content?.news_item) ? item.content.news_item : [];

    return newsItems
      .map((article: any) => ({
        title: typeof article?.title === 'string' ? article.title.trim() : '',
        url: typeof article?.url === 'string' ? article.url.trim() : '',
        publishedAt,
      }))
      .filter((article: PublishedArticle) => article.title && article.url && article.publishedAt > 0);
  });
}

export async function GET(request: Request) {
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
  }

  try {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;
    if (!appId || !appSecret) {
      return NextResponse.json(
        { success: false, message: 'missing-wechat-env' },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedCount = Number(searchParams.get('count') || '20');
    const count = Math.min(20, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 20));
    const accessToken = await getAccessToken(appId, appSecret);
    const response = await fetch(`${WECHAT_PUBLISHED_URL}?access_token=${encodeURIComponent(accessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offset: 0, count, no_content: 1 }),
      cache: 'no-store',
    });
    const data = await response.json();

    if (!response.ok || data?.errcode) {
      throw new Error(`get-published-articles-failed: ${data?.errmsg || response.statusText || 'unknown'}`);
    }

    const articles = sanitizePublishedArticles(data);
    return NextResponse.json(
      {
        success: true,
        data: {
          total: Number(data?.total_count || articles.length),
          articles,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown-error';
    return NextResponse.json(
      { success: false, message },
      { status: 502 },
    );
  }
}
