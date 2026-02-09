import fs from 'fs';
import path from 'path';

describe('re-exported locale pages', () => {
  test('llm-articles re-exports default & generateMetadata', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/llm-articles/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("export { default, generateMetadata } from '@/app/llm-articles/page'");
  });

  test('test-clarity re-exports default', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/test-clarity/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("export { default } from '@/app/test-clarity/page'");
  });

  test('search re-exports default', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/search/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("export { default } from '@/app/search/page'");
  });
});

