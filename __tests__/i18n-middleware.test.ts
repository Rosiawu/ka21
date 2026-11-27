import fs from 'fs';
import path from 'path';

// 中间件同时做两件事：
// - www / http 归一到 https://ka21.org
// - 只有根路径做语言识别，其他路径原样继续

describe('i18n middleware', () => {
  test('middleware file contains expected logic', () => {
    const p = path.join(process.cwd(), 'src/middleware.ts');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('export function middleware');
    expect(content).toContain('resolvePreferredLocale');
    expect(content).toContain('getCanonicalRedirectTarget');
    expect(content).toContain("req.nextUrl.pathname !== '/'");
    expect(content).toContain('NextResponse.redirect');
    expect(content).toContain('export const config');
    expect(content).toContain("matcher: ['/((?!_next/static|_next/image).*)']");
  });
});
