// 中间件：首跳语言识别与重定向
// 作用：当访问未带语言前缀的路径时，根据 Cookie/Accept-Language 识别语言并重定向到对应的语言前缀路径

import {NextRequest, NextResponse} from 'next/server';
import {resolvePreferredLocale} from './src/i18n/resolveLocale';

export function middleware(req: NextRequest) {
  // 按优先级取语言：cookie.locale > 请求头 Accept-Language > defaultLocale
  const preferred = resolvePreferredLocale({
    cookieLocale: req.cookies.get('locale')?.value,
    acceptLanguage: req.headers.get('accept-language'),
  });

  const url = req.nextUrl.clone();
  url.pathname = `/${preferred}`;
  return NextResponse.redirect(url);
}

// 匹配所有非 _next 资源的路径
export const config = {
  matcher: ['/']
};
