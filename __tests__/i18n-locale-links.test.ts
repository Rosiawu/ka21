import fs from 'fs';
import path from 'path';

describe('locale-aware links', () => {
  test('HomeContent imports locale-aware Link wrapper', () => {
    const p = path.join(process.cwd(), 'src/components/HomeContent.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("from '@/i18n/Link'");
  });

  test('SearchContent imports locale-aware Link wrapper', () => {
    const p = path.join(process.cwd(), 'src/components/SearchContent.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("from '@/i18n/Link'");
  });

  test('not-found can use next/link safely', () => {
    const p = path.join(process.cwd(), 'src/app/not-found.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("from 'next/link'");
  });
});
