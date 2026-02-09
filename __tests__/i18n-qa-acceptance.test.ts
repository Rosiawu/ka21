import fs from 'fs';
import path from 'path';

// 中文说明：
// 轻量级 QA 验收断言（静态检查）：
// 1）关键本地化页面存在（/zh 与 /en 子树统一在 [locale] 下维护）；
// 2）[locale]/layout.tsx 中挂载了 NextIntl Provider 与 LocaleTag（保证 i18n 与埋点注入）；
// 3）非本地化路径 search/test-clarity 做了重定向（避免预渲染报错）。

const exists = (p: string) => fs.existsSync(path.join(process.cwd(), p));
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('QA & Acceptance - i18n routes and wiring', () => {
  test('localized routes exist under src/app/[locale]/...', () => {
    const mustHave = [
      'src/app/[locale]/page.tsx',
      'src/app/[locale]/layout.tsx',
      'src/app/[locale]/about/page.tsx',
      'src/app/[locale]/search/page.tsx',
      'src/app/[locale]/tutorials/page.tsx',
      'src/app/[locale]/unified-search/page.tsx',
      'src/app/[locale]/llm-articles/page.tsx',
      'src/app/[locale]/test-clarity/page.tsx',
      'src/app/[locale]/tools'
    ];
    mustHave.forEach((p) => expect(exists(p)).toBe(true));
  });

  test('[locale]/layout wires NextIntlClientProvider and LocaleTag', () => {
    const content = read('src/app/[locale]/layout.tsx');
    expect(content).toContain('NextIntlClientProvider');
    expect(content).toContain('LocaleTag');
  });

  test('root non-localized search/test-clarity redirect to /zh/...', () => {
    const s = read('src/app/search/page.tsx');
    const c = read('src/app/test-clarity/page.tsx');
    expect(s).toContain("redirect('/zh/search')");
    expect(c).toContain("redirect('/zh/test-clarity')");
  });
});

