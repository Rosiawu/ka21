import fs from 'fs';
import path from 'path';

describe('[locale]/page locale handling', () => {
  test('uses setRequestLocale and getTranslations', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('setRequestLocale');
    expect(content).toContain("getTranslations('Home')");
  });
});

