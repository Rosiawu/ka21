import fs from 'fs';
import path from 'path';

describe('Sidebar locale-aware navigation', () => {
  test('imports next/link and next/navigation (locale handled internally)', () => {
    const p = path.join(process.cwd(), 'src/components/Sidebar.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain("from 'next/link'");
    expect(content).toContain("from 'next/navigation'");
    expect(content).toContain('localizeHref');
  });
});
