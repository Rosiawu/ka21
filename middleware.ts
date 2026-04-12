// 中间件：首跳语言识别与重定向
// 作用：当访问未带语言前缀的路径时，根据 Cookie/Accept-Language 识别语言并重定向到对应的语言前缀路径

import {NextRequest, NextResponse} from 'next/server';
import {getLocaleFromPathname, resolvePreferredLocale} from './src/i18n/resolveLocale';

export function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl;
  const pathnameLocale = getLocaleFromPathname(pathname);

  // 放行：API、Next 静态资源与已含语言前缀的路径
  // 排除 /_next/, /api, /favicon.ico 等
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathnameLocale
  ) {
    if (!pathnameLocale) {
      return NextResponse.next();
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-ka21-locale', pathnameLocale);
    return NextResponse.next({request: {headers: requestHeaders}});
  }

  // 按优先级取语言：cookie.locale > 请求头 Accept-Language > defaultLocale
  const preferred = resolvePreferredLocale({
    cookieLocale: req.cookies.get('locale')?.value,
    acceptLanguage: req.headers.get('accept-language'),
  });

  const url = req.nextUrl.clone();
  url.pathname = `/${preferred}${pathname}`;
  return NextResponse.redirect(url);
}

// 匹配所有非 _next 资源的路径
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)']
};
