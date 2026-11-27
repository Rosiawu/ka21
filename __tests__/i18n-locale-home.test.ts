import fs from 'fs';
import path from 'path';

describe('locale home page', () => {
  test('loads the Home subtitle for the active locale', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('messages.Home?.subtitle');
    expect(content).toContain('<HomeContent subtitle={subtitle}');
  });
});