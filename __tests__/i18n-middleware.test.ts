import fs from 'fs';
import path from 'path';

// 中文说明：
// 校验中间件存在并包含核心逻辑：
// - 导出 middleware 函数
// - 通过共享 helper 解析语言
// - 只处理根路径语言识别，其他路径直接走静态路由或 Next 404
// - 导出 config.matcher

describe('i18n middleware', () => {
  test('middleware file contains expected logic', () => {
    const p = path.join(process.cwd(), 'middleware.ts');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('export function middleware');
    expect(content).toContain('resolvePreferredLocale');
    expect(content).toContain("matcher: ['/']");
    expect(content).toContain('NextResponse.redirect');
    expect(content).toContain('export const config');
    expect(content).toContain('matcher');
  });
});
