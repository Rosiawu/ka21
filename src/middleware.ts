// 中间件：
// 1. 生产域名归一：www -> apex，http -> https（仅 ka21.org / www.ka21.org）
// 2. 根路径按 Cookie / Accept-Language 跳到语言前缀
// 放在 src/ 下，Next 才会和 src/app 一起编译它。

import {NextRequest, NextResponse} from 'next/server';
import {getCanonicalRedirectTarget, selectPublicHostname} from './lib/canonicalHost';
import {resolvePreferredLocale} from './i18n/resolveLocale';

function requestHostname(req: NextRequest): string {
  // nextUrl can be the bind address. Prefer whichever header actually names ka21.org.
  return selectPublicHostname([
    req.headers.get('x-forwarded-host'),
    req.headers.get('host'),
    req.nextUrl.host,
  ]);
}

export function middleware(req: NextRequest) {
  const redirectTarget = getCanonicalRedirectTarget({
    protocol: req.nextUrl.protocol,
    hostname: requestHostname(req),
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
    forwardedProto: req.headers.get('x-forwarded-proto'),
    cfVisitor: req.headers.get('cf-visitor'),
  });
  if (redirectTarget) {
    return NextResponse.redirect(redirectTarget, 301);
  }

  // 语言识别只处理站点根路径。其他路径保持原样，交给页面或静态资源。
  if (req.nextUrl.pathname !== '/') {
    return NextResponse.next();
  }

  const preferred = resolvePreferredLocale({
    cookieLocale: req.cookies.get('locale')?.value,
    acceptLanguage: req.headers.get('accept-language'),
  });

  const url = req.nextUrl.clone();
  url.pathname = `/${preferred}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 静态资源由 Cloudflare 资产层直接返回，到不了这里。
  // 这里覆盖会进入 Worker 的页面、sitemap 和接口，以便归一 host / scheme。
  matcher: ['/((?!_next/static|_next/image).*)'],
};
