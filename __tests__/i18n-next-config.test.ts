import fs from 'fs';
import path from 'path';

describe('next-intl plugin configuration', () => {
  test('next.config.js uses next-intl plugin without duplicating root redirect policy', () => {
    const configPath = path.join(process.cwd(), 'next.config.js');
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain("require('next-intl/plugin')");
    expect(content).toContain('withNextIntl');
    expect(content).not.toContain("source: '/'");
    expect(content).not.toContain("destination: '/zh'");
  });
});
