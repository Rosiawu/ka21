// src/i18n/config.ts
// 集中管理支持的语言环境和默认语言

export const supportedLocales = ['zh', 'en'] as const;
export type AppLocale = typeof supportedLocales[number];

export const defaultLocale: AppLocale = 'zh'; // 明确定义默认语言

export function isSupportedLocale(locale: string): locale is AppLocale {
  return supportedLocales.includes(locale as AppLocale);
}

export const localeNames: Record<AppLocale, string> = {
  zh: '中文',
  en: 'English'
};
