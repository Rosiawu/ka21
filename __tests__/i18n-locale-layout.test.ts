import fs from 'fs';
import path from 'path';

describe('locale layout', () => {
  test('exists and uses NextIntlClientProvider', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    expect(content).toContain('NextIntlClientProvider');
    expect(content).toContain('type LocaleParams = Promise<{locale: string}>;');
  });

  test('root layout stays static and LocaleTag updates html lang on localized pages', () => {
    const rootLayoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const localeTagPath = path.join(process.cwd(), 'src/components/LocaleTag.tsx');
    const rootContent = fs.readFileSync(rootLayoutPath, 'utf8');
    const localeTagContent = fs.readFileSync(localeTagPath, 'utf8');
    expect(rootContent).toContain('<html lang="zh-CN"');
    expect(rootContent).not.toContain("from 'next/headers'");
    expect(localeTagContent).toContain("document.documentElement.setAttribute('lang', lang)");
  });
});
