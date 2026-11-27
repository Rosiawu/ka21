import { generateHreflangTags, normalizeCanonicalPath } from '../hreflang';

describe('canonical path normalization', () => {
  test('locale homepages have no trailing slash', () => {
    expect(normalizeCanonicalPath('')).toBe('');
    expect(normalizeCanonicalPath('/')).toBe('');

    const tags = generateHreflangTags('https://ka21.org', 'zh', '');
    expect(tags.canonical).toBe('https://ka21.org/zh');
    expect(tags.languages).toEqual({
      zh: 'https://ka21.org/zh',
      en: 'https://ka21.org/en',
      'x-default': 'https://ka21.org/zh',
    });
  });

  test('inner pages are self-referencing and slash-free', () => {
    expect(normalizeCanonicalPath('devlog/')).toBe('/devlog');
    expect(normalizeCanonicalPath('/tools/chatgpt/')).toBe('/tools/chatgpt');

    const tags = generateHreflangTags('https://ka21.org/', 'en', 'devlog');
    expect(tags.canonical).toBe('https://ka21.org/en/devlog');
    expect(tags.languages.zh).toBe('https://ka21.org/zh/devlog');
    expect(tags.languages.en).toBe('https://ka21.org/en/devlog');
  });
});
