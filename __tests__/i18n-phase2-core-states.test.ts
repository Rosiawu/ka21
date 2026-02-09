import fs from 'fs';
import path from 'path';

// 中文说明：
// 覆盖“核心页面空态/错误态/加载态/按钮文案接入 i18n”：
// ToolList（空态、数量、查看全部）、ErrorState、ErrorBoundary、SearchBar（占位/aria）。

describe('Phase 2 - Core states i18n wiring', () => {
  const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
  const zh = JSON.parse(read('messages/zh.json'));
  const en = JSON.parse(read('messages/en.json'));

  test('ToolList uses Search/Common/ToolList translations', () => {
    const content = read('src/components/ToolList.tsx');
    expect(content).toContain("useTranslations('Search')");
    expect(content).toContain("useTranslations('Common')");
    expect(content).toContain("useTranslations('ToolList')");
    // keys exist
    expect(zh.Search.results).toBeTruthy();
    expect(en.Search.results).toBeTruthy();
    expect(zh.Common.totalCount).toBeTruthy();
    expect(en.Common.totalCount).toBeTruthy();
    expect(zh.ToolList.emptyTitle).toBeTruthy();
    expect(en.ToolList.emptyTitle).toBeTruthy();
  });

  test('ErrorState uses Common.loadFailed/Common.retry', () => {
    const content = read('src/components/ErrorState.tsx');
    expect(content).toContain("useTranslations('Common')");
    expect(zh.Common.loadFailed).toBeTruthy();
    expect(en.Common.loadFailed).toBeTruthy();
    expect(zh.Common.retry).toBeTruthy();
    expect(en.Common.retry).toBeTruthy();
  });

  test('ErrorBoundary provides static fallback texts (outside i18n Provider)', () => {
    const content = read('src/components/ErrorBoundary.tsx');
    // 错误边界在 Provider 外，使用静态中文文案
    expect(content).toContain('抱歉，出现了一些问题');
    expect(content).toContain('重试');
  });

  test('SearchBar uses Search translations for placeholder and aria', () => {
    const content = read('src/components/SearchBar.tsx');
    expect(content).toContain("useTranslations('Search')");
    expect(zh.Search.searchPlaceholder).toBeTruthy();
    expect(en.Search.searchPlaceholder).toBeTruthy();
    expect(zh.Search.inputAriaLabel).toBeTruthy();
    expect(en.Search.inputAriaLabel).toBeTruthy();
    expect(zh.Search.clearAction).toBeTruthy();
    expect(en.Search.clearAction).toBeTruthy();
  });
});
