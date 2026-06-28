import { NextResponse } from 'next/server';
import { getAdminSessionState } from '@/lib/security/admin';

const ADMIN_PROXY_HEADER = 'x-ka21-admin-proxy';
const DEFAULT_ADMIN_PROXY_BASE = 'https://ka21-tools.woorosia.workers.dev';

function getAdminProxyBase() {
  return (process.env.KA21_ADMIN_PROXY_BASE || DEFAULT_ADMIN_PROXY_BASE).replace(/\/+$/, '');
}

export function shouldProxyAdminRequest(request: Request) {
  if (request.headers.get(ADMIN_PROXY_HEADER) === '1') {
    return false;
  }

  const state = getAdminSessionState(request);
  if (state.mode !== 'disabled') {
    return false;
  }

  const proxyBase = getAdminProxyBase();
  if (!proxyBase) {
    return false;
  }

  try {
    return new URL(request.url).host !== new URL(proxyBase).host;
  } catch {
    return false;
  }
}

export async function proxyAdminRequest(request: Request, pathname: string) {
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(pathname, getAdminProxyBase());
  targetUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('accept-encoding');
  headers.set(ADMIN_PROXY_HEADER, '1');

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('transfer-encoding');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
