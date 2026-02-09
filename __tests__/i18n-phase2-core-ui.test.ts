import fs from 'fs';
import path from 'path';

// 中文说明：
// 该测试用于验证“第 2 阶段 - 核心页面文案 i18n 接入”的关键点：
// 1）首页与搜索页组件已接入 useTranslations 并使用对应命名空间键；
// 2）消息文件中存在这些被使用的键，避免运行时找不到翻译。

describe('Phase 2 - Core UI i18n wiring', () => {
  test('HomeContent uses Home/Common translations and keys exist', () => {
    const homePath = path.join(process.cwd(), 'src/components/HomeContent.tsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');
    // 组件内使用 useTranslations('Home'|'Common')
    expect(homeContent).toContain("useTranslations('Home')");
    expect(homeContent).toContain("useTranslations('Common')");
    // 组件引用的若干关键键
    ['subtitle','tutorials','readMore','filtered','tutorialsSourceNote','collapse','noTutorialsTitle','noTutorialsHint','browseAllTutorials','scrollDownToViewTools','allCategoriesTitle','allCategoriesDesc','searchPlaceholder','scrollLeft','scrollRight','jumpToTutorialPage'].forEach(k => {
      // 允许函数带参数（例如 jumpToTutorialPage, {index: ...}）
      expect(homeContent.includes(`tHome('${k}')`) || homeContent.includes(`tHome('${k}',`)).toBe(true);
    });

    // 对应消息文件必须包含上述键
    const zh = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages/zh.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'));
    const zhHome = zh.Home || {};
    const enHome = en.Home || {};
    ['subtitle','tutorials','readMore','filtered','tutorialsSourceNote','collapse','noTutorialsTitle','noTutorialsHint','browseAllTutorials','scrollDownToViewTools','allCategoriesTitle','allCategoriesDesc','searchPlaceholder','scrollLeft','scrollRight','jumpToTutorialPage'].forEach(k => {
      expect(zhHome[k]).toBeTruthy();
      expect(enHome[k]).toBeTruthy();
    });
  });

  test('SearchContent uses Search/Common translations and keys exist', () => {
    const spath = path.join(process.cwd(), 'src/components/SearchContent.tsx');
    const scontent = fs.readFileSync(spath, 'utf8');
    // 组件内使用 useTranslations('Search'|'Common')
    expect(scontent).toContain("useTranslations('Search')");
    expect(scontent).toContain("useTranslations('Common')");
    // 组件引用的若干关键键
    ['results','subtitle','searchPlaceholder','searchAction','allTools','categoryPrefix','searchPrefix','shareResults','linkCopied','breadcrumbLabel','unknownCategory'].forEach(k => {
      expect(scontent).toContain(`tSearch('${k}')`);
    });

    // 对应消息文件必须包含上述键
    const zh = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages/zh.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'));
    const zhSearch = zh.Search || {};
    const enSearch = en.Search || {};
    ['results','subtitle','searchPlaceholder','searchAction','allTools','categoryPrefix','searchPrefix','shareResults','linkCopied','breadcrumbLabel','unknownCategory'].forEach(k => {
      expect(zhSearch[k]).toBeTruthy();
      expect(enSearch[k]).toBeTruthy();
    });
  });

  test('Sort controls use Sort translations and keys exist', () => {
    const sortPath = path.join(process.cwd(), 'src/components/ToolSortControls.tsx');
    const sortContent = fs.readFileSync(sortPath, 'utf8');
    expect(sortContent).toContain("useTranslations('Sort')");
    const zh = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages/zh.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'));
    const zhSort = zh.Sort || {};
    const enSort = en.Sort || {};
    ['label','default','recommend','newest','name'].forEach(k => {
      expect(zhSort[k]).toBeTruthy();
      expect(enSort[k]).toBeTruthy();
    });
  });
});
