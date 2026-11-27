import sitemap from '../../app/sitemap';

describe('sitemap indexable URLs', () => {
  const urls = sitemap().map((entry) => entry.url);

  test('lists final app URLs without redirecting or trailing-slash duplicates', () => {
    expect(urls).not.toContain('https://ka21.org');
    expect(urls).not.toContain('https://ka21.org/');
    expect(urls).not.toContain('https://ka21.org/zh/tools');
    expect(urls).not.toContain('https://ka21.org/en/tools');
    expect(urls).toContain('https://ka21.org/zh');
    expect(urls).toContain('https://ka21.org/en');
    expect(urls).toContain('https://ka21.org/zh/devlog');
    expect(urls).toContain('https://ka21.org/en/devlog');
    expect(urls).toContain('https://ka21.org/zh/deals');
    expect(urls).toContain('https://ka21.org/personal-site/');
    expect(urls).toContain('https://ka21.org/podcast-dashboard/');

    const appUrls = urls.filter((url) => !url.endsWith('/personal-site/') && !url.endsWith('/podcast-dashboard/'));
    expect(appUrls.every((url) => !url.endsWith('/'))).toBe(true);
    expect(urls.every((url) => url.startsWith('https://ka21.org/'))).toBe(true);
  });
});
