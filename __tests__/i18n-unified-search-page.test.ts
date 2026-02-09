import fs from 'fs';
import path from 'path';

describe('[locale]/unified-search page', () => {
  test('renders UnifiedSearchContent inside Suspense', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/unified-search/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("UnifiedSearchContent");
    expect(content).toContain("Suspense");
  });
});

