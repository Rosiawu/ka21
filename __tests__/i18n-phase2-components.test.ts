import fs from 'fs';
import path from 'path';

// 中文说明：
// 验证“第 2 阶段 - 组件常用标签与提示 i18n”是否正确接入。

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
const readJSON = (p: string) => JSON.parse(read(p));

describe('Phase 2 - Components i18n wiring', () => {
  const zh = readJSON('messages/zh.json');
  const en = readJSON('messages/en.json');

  test('LoadingState uses Common.loading', () => {
    const content = read('src/components/LoadingState.tsx');
    expect(content).toContain("useTranslations('Common')");
    expect(zh.Common.loading).toBeTruthy();
    expect(en.Common.loading).toBeTruthy();
  });

  test('BackToTopButton uses Common.backToTop', () => {
    const content = read('src/components/BackToTopButton.tsx');
    expect(content).toContain("useTranslations('Common')");
    expect(content).toContain("backToTop");
    expect(zh.Common.backToTop).toBeTruthy();
    expect(en.Common.backToTop).toBeTruthy();
  });

  test('TutorialSortControls uses TutorialSort namespace', () => {
    const content = read('src/components/TutorialSortControls.tsx');
    expect(content).toContain("useTranslations('TutorialSort')");
    const keys = ['label','latestFirst','oldestFirst','easyToHard'] as const;
    keys.forEach(k => {
      expect(zh.TutorialSort[k]).toBeTruthy();
      expect(en.TutorialSort[k]).toBeTruthy();
    });
  });

  test('ClarityNetworkMonitor uses Clarity namespace', () => {
    const content = read('src/components/ClarityNetworkMonitor.tsx');
    expect(content).toContain("useTranslations('Clarity')");
    const keys = ['monitorTitle','initLabel','initYes','initNo','networkLabel','networkYes','networkWait','lastActivity','eventCount','tip','ok'] as const;
    keys.forEach(k => {
      expect(zh.Clarity[k]).toBeTruthy();
      expect(en.Clarity[k]).toBeTruthy();
    });
  });

  test('StatsDisplay uses Stats namespace', () => {
    const content = read('src/components/StatsDisplay.tsx');
    expect(content).toContain("useTranslations('Stats')");
    const keys = ['coreToolsLabel','utilsLabel','tutorialsLabel','strategyNote'] as const;
    keys.forEach(k => {
      expect(zh.Stats[k]).toBeTruthy();
      expect(en.Stats[k]).toBeTruthy();
    });
  });

  test('TutorialCard uses Home.readMore', () => {
    const content = read('src/components/TutorialCard.tsx');
    expect(content).toContain("useTranslations('Home')");
    expect(content).toContain("tHome('readMore')");
    expect(zh.Home.readMore).toBeTruthy();
    expect(en.Home.readMore).toBeTruthy();
  });
});

