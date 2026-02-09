// 语言切换路径构造工具函数
// 输入当前路径与目标语言，返回切换语言后的新路径

import {supportedLocales, AppLocale} from './locale';

// 判断路径是否以受支持的语言前缀开头
function startsWithSupportedLocale(pathname: string): boolean {
  return supportedLocales.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
}

export function buildLocalePath(pathname: string, targetLocale: AppLocale): string {
  // 防御：空路径直接返回带前缀的根路径
  if (!pathname || pathname === '/') return `/${targetLocale}`;

  if (startsWithSupportedLocale(pathname)) {
    // 将第一个段替换为目标语言
    const segments = pathname.split('/');
    // segments[0] 为 ''，segments[1] 为当前语言
    segments[1] = targetLocale;
    return segments.join('/') || `/${targetLocale}`;
  }

  // 不带语言前缀的路径，直接添加目标语言作为前缀
  return `/${targetLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

