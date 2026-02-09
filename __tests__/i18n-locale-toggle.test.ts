import {buildLocalePath} from '@/i18n/localeSwitch';
import fs from 'fs';
import path from 'path';

// 中文说明：
// 验证语言切换构造函数与组件存在性。

describe('Locale toggle', () => {
  test('buildLocalePath switches prefixes correctly', () => {
    expect(buildLocalePath('/zh', 'en')).toBe('/en');
    expect(buildLocalePath('/zh/search', 'en')).toBe('/en/search');
    expect(buildLocalePath('/en/tools/abc', 'zh')).toBe('/zh/tools/abc');
    expect(buildLocalePath('/', 'zh')).toBe('/zh');
    expect(buildLocalePath('/tutorials', 'en')).toBe('/en/tutorials');
  });

  test('component exists and is client component', () => {
    const p = path.join(process.cwd(), 'src/components/LocaleToggle.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('"use client"');
    expect(content).toContain('usePathname');
    expect(content).toContain('buildLocalePath');
  });
});

