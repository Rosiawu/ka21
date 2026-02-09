import fs from 'fs';
import path from 'path';

// 中文说明：
// 验证 generateMetadata 在 [locale]/layout 中已接入 i18n 标题/描述，并添加 hreflang。

describe('i18n metadata in [locale]/layout', () => {
  test('generateMetadata exists and uses translations with alternates', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('export async function generateMetadata');
    expect(content).toContain("getTranslations('Common')");
    expect(content).toContain("getTranslations('Home')");
    expect(content).toContain('alternates');
    expect(content).toContain('languages');
  });
});

