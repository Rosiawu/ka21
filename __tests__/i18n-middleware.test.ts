import fs from 'fs';
import path from 'path';

// 中文说明：
// 校验中间件存在并包含核心逻辑：
// - 导出 middleware 函数
// - 通过共享 helper 解析语言
// - 对本地化路径写入 x-ka21-locale 请求头
// - 导出 config.matcher

describe('i18n middleware', () => {
  test('middleware file contains expected logic', () => {
    const p = path.join(process.cwd(), 'middleware.ts');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('export function middleware');
    expect(content).toContain('resolvePreferredLocale');
    expect(content).toContain('x-ka21-locale');
    expect(content).toContain('NextResponse.redirect');
    expect(content).toContain('export const config');
    expect(content).toContain('matcher');
  });
});
