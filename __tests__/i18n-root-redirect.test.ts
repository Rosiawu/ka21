import fs from 'fs';
import path from 'path';

describe('root redirect', () => {
  test('redirects from / to /zh', () => {
    const p = path.join(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("redirect('/zh')");
  });
});

