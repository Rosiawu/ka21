import fs from 'fs';
import path from 'path';

describe('locale home page', () => {
  test('uses getTranslations for Home namespace', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("getTranslations('Home')");
    expect(content).toContain('<HomeContent subtitle={subtitle} />');
  });
});

