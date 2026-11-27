import fs from 'fs';
import path from 'path';

describe('[locale]/page locale handling', () => {
  test('uses setRequestLocale and the active locale message bundle', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('setRequestLocale(locale)');
    expect(content).toContain('messages/${locale}.json');
    expect(content).toContain('messages.Home?.subtitle');
  });
});
