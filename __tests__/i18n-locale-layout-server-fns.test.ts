import fs from 'fs';
import path from 'path';

describe('[locale]/layout server functions', () => {
  test('layout uses setRequestLocale and getMessages', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('setRequestLocale');
    expect(content).toContain('getMessages');
  });
});

