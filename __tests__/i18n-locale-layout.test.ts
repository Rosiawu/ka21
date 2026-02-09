import fs from 'fs';
import path from 'path';

describe('locale layout', () => {
  test('exists and uses NextIntlClientProvider', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    expect(content).toContain('NextIntlClientProvider');
    expect(content).toContain('params: {locale: string}');
  });
});

