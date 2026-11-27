import fs from 'fs';
import path from 'path';

// 语言布局只提供默认标题/描述。
// 首页 canonical 放在页面自己的 metadata 里，避免子页面继承首页地址。

describe('i18n metadata in [locale]/layout', () => {
  test('layout sets translated defaults and does not publish a homepage canonical', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    expect(content).toContain('export async function generateMetadata');
    expect(content).toContain('messages.Common?.siteTitle');
    expect(content).toContain('messages.Home?.subtitle');
    expect(content).not.toContain('alternates');
    expect(content).not.toContain('generateHreflangMetadata');
  });

  test('locale home declares its own canonical', () => {
    const pagePath = path.join(process.cwd(), 'src/app/[locale]/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    expect(content).toContain('generateHreflangMetadata');
    expect(content).toContain('alternates');
    expect(content).toContain('canonical: hreflang.canonical');
  });
});
