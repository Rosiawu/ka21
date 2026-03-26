import { defaultLocale, isSupportedLocale, type AppLocale } from './config';

type AcceptLanguageEntry = {
  lang: string;
  q: number;
};

export function getLocaleFromPathname(pathname: string): AppLocale | undefined {
  const firstSegment = pathname.split('/')[1];
  return isSupportedLocale(firstSegment) ? firstSegment : undefined;
}

export function parseAcceptLanguage(acceptLanguage: string): AcceptLanguageEntry[] {
  return acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, qValue] = part.trim().split(';');
      const q = qValue ? parseFloat(qValue.split('=')[1]) : 1;
      return { lang, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => Boolean(entry.lang))
    .sort((a, b) => b.q - a.q);
}

export function resolvePreferredLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): AppLocale {
  if (input.cookieLocale && isSupportedLocale(input.cookieLocale)) {
    return input.cookieLocale;
  }

  for (const { lang } of parseAcceptLanguage(input.acceptLanguage || '')) {
    if (isSupportedLocale(lang)) {
      return lang;
    }

    const baseLang = lang.split('-')[0];
    if (isSupportedLocale(baseLang)) {
      return baseLang;
    }
  }

  return defaultLocale;
}

export function toHtmlLang(locale?: string | null): 'zh-CN' | 'en' {
  return locale === 'en' ? 'en' : 'zh-CN';
}
