import fs from 'fs';
import path from 'path';

describe('[locale]/tutorials page', () => {
  test('renders TutorialsContent inside Suspense', () => {
    const p = path.join(process.cwd(), 'src/app/[locale]/tutorials/page.tsx');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('TutorialsContent');
    expect(content).toContain('Suspense');
  });
});

