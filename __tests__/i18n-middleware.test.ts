import fs from 'fs';
import path from 'path';

// 中文说明：
// 校验中间件存在并包含核心逻辑：
// - 导出 middleware 函数
// - 使用 Accept-Language 与 Cookie 选择语言
// - 使用 NextResponse.redirect 重定向
// - 导出 config.matcher

describe('i18n middleware', () => {
  test('middleware file contains expected logic', () => {
    const p = path.join(process.cwd(), 'middleware.ts');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('export function middleware');
    expect(content).toContain('accept-language');
    expect(content).toContain('NextResponse.redirect');
    expect(content).toContain('export const config');
    expect(content).toContain('matcher');
  });
});

