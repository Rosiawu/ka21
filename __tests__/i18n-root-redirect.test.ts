import fs from 'fs';
import path from 'path';

describe('root redirect', () => {
  test('root page resolves locale instead of hardcoding /zh', () => {
    const p = path.join(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('resolvePreferredLocale');
    expect(content).toContain('redirect(`/${preferredLocale}`)');
    expect(content).not.toContain("redirect('/zh')");
  });
});
