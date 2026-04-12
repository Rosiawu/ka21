import fs from 'fs';
import path from 'path';

describe('locale layout', () => {
  test('exists and uses NextIntlClientProvider', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    expect(content).toContain('NextIntlClientProvider');
    expect(content).toContain('type LocaleParams = Promise<{locale: string}>;');
  });

  test('root layout derives html lang from locale header', () => {
    const rootLayoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const content = fs.readFileSync(rootLayoutPath, 'utf8');
    expect(content).toContain('x-ka21-locale');
    expect(content).toContain('toHtmlLang');
    expect(content).not.toContain('<html lang="zh-CN"');
  });
});
