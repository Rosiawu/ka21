import fs from 'fs';
import path from 'path';

describe('[locale]/tools/[id] page', () => {
  test('contains ToolDetail and toolsData usage', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/tools/[id]/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('ToolDetail');
    expect(content).toContain("from '@/data/tools.json'");
  });
});

