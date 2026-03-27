import fs from 'fs';
import path from 'path';

describe('[locale]/about page', () => {
  test('re-exports default and generateMetadata from /about/page', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/about/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("export { default, generateMetadata } from '@/app/about/page'");
  });

  test('/about page uses next/link so it can render without intl context', () => {
    const p = path.join(process.cwd(), 'src/app/about/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("import Link from 'next/link'");
    expect(content).not.toContain("import Link from '@/i18n/Link'");
  });
});
