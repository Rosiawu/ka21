import {
  getLocaleFromPathname,
  parseAcceptLanguage,
  resolvePreferredLocale,
  toHtmlLang,
} from '@/i18n/resolveLocale';

describe('locale resolution helpers', () => {
  test('prefers cookie locale over accept-language', () => {
    expect(
      resolvePreferredLocale({
        cookieLocale: 'en',
        acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8',
      }),
    ).toBe('en');
  });

  test('falls back to weighted accept-language when cookie is absent', () => {
    expect(
      resolvePreferredLocale({
        acceptLanguage: 'fr;q=0.6,en-US;q=0.9,zh;q=0.7',
      }),
    ).toBe('en');
  });

  test('extracts locale from pathname when present', () => {
    expect(getLocaleFromPathname('/en/tools/chatgpt')).toBe('en');
    expect(getLocaleFromPathname('/zh/tutorials')).toBe('zh');
    expect(getLocaleFromPathname('/tools/chatgpt')).toBeUndefined();
  });

  test('maps locale to correct html lang value', () => {
    expect(toHtmlLang('en')).toBe('en');
    expect(toHtmlLang('zh')).toBe('zh-CN');
    expect(toHtmlLang(undefined)).toBe('zh-CN');
  });

  test('parses accept-language with quality order', () => {
    expect(parseAcceptLanguage('zh-CN;q=0.6,en-US;q=0.9,en;q=0.8')).toEqual([
      { lang: 'en-US', q: 0.9 },
      { lang: 'en', q: 0.8 },
      { lang: 'zh-CN', q: 0.6 },
    ]);
  });
});
