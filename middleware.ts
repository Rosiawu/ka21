// 中间件：首跳语言识别与重定向
// 作用：当访问未带语言前缀的路径时，根据 Cookie/Accept-Language 识别语言并重定向到对应的语言前缀路径

import {NextRequest, NextResponse} from 'next/server';
import {supportedLocales, defaultLocale, AppLocale} from './src/i18n/config';

// 判断路径是否包含受支持的语言前缀
function hasLocalePrefix(pathname: string): boolean {
  const firstSegment = pathname.split('/')[1];
  return supportedLocales.includes(firstSegment as AppLocale);
}

// 辅助函数：根据 Accept-Language 匹配最佳语言
// 辅助函数：解析 Accept-Language 头，考虑 q 值
function parseAcceptLanguage(acceptLanguage: string): { lang: string; q: number }[] {
  return acceptLanguage
    .split(',')
    .map(part => {
      const [lang, qValue] = part.trim().split(';');
      const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      return { lang, q };
    })
    .sort((a, b) => b.q - a.q); // 按质量值降序排序
}

// 辅助函数：根据 Accept-Language 匹配最佳语言
function getPreferredLocaleFromAcceptLanguage(acceptLanguage: string): AppLocale | undefined {
  const parsedLanguages = parseAcceptLanguage(acceptLanguage);

  for (const { lang } of parsedLanguages) {
    // 尝试精确匹配
    if (supportedLocales.includes(lang as AppLocale)) {
      return lang as AppLocale;
    }
    // 尝试更广泛的匹配 (例如, en-US -> en)
    const baseLang = lang.split('-')[0];
    if (supportedLocales.includes(baseLang as AppLocale)) {
      return baseLang as AppLocale;
    }
  }
  return undefined;
}

export function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl;

  // 放行：API、Next 静态资源与已含语言前缀的路径
  // 排除 /_next/, /api, /favicon.ico 等
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    hasLocalePrefix(pathname)
  ) {
    return NextResponse.next();
  }

  // 按优先级取语言：cookie.locale > 请求头 Accept-Language > defaultLocale
  const cookieLocale = req.cookies.get('locale')?.value as AppLocale | undefined;
  const acceptLang = req.headers.get('accept-language') || '';

  let preferred: AppLocale = defaultLocale;

  if (cookieLocale && supportedLocales.includes(cookieLocale)) {
    preferred = cookieLocale;
  } else {
    const preferredFromAcceptLanguage = getPreferredLocaleFromAcceptLanguage(acceptLang);
    if (preferredFromAcceptLanguage) {
      preferred = preferredFromAcceptLanguage;
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${preferred}${pathname}`;
  return NextResponse.redirect(url);
}

// 匹配所有非 _next 资源的路径
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)']
};

