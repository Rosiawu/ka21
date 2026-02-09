import fs from 'fs';
import path from 'path';

describe('[locale]/layout static params', () => {
  test('exports generateStaticParams for zh and en', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('export function generateStaticParams()');
    expect(content).toContain("{ locale: 'zh' }");
    expect(content).toContain("{ locale: 'en' }");
  });
});

