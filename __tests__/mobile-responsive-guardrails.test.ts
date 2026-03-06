import fs from 'fs';
import path from 'path';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('mobile responsive guardrails', () => {
  test('home hero keeps mobile-first podcast card structure', () => {
    const content = read('src/components/HomeContent.tsx');
    expect(content).toContain('grid-cols-2');
    expect(content).toContain('h-[196px] w-full');
    expect(content).toContain('w-full flex-col justify-between');
    expect(content).toContain('sm:flex-row');
    expect(content).toContain('w-full shrink-0');
    expect(content).toContain('sm:w-[208px]');
  });

  test('home logo and composer rows include mobile fallback classes', () => {
    const content = read('src/components/HomeContent.tsx');
    expect(content).toContain('h-[196px] w-full');
    expect(content).toContain('sm:h-[220px] sm:w-[220px]');
    expect(content).toContain('relative flex h-[196px] w-full');
    expect(content).toContain('absolute inset-x-3 bottom-4');
    expect(content).toContain('text-center text-[12px] leading-snug');
    expect(content).toContain('mobileSubtitleParts[0]');
    expect(content).toContain('sm:hidden');
    expect(content).toContain('flex flex-col items-stretch');
    expect(content).toContain('sm:flex-row sm:items-center');
  });

  test('podcast card keeps only mobile listen hint under the title', () => {
    const content = read('src/components/HomeContent.tsx');
    expect(content).toContain("cta: isEn ? 'Tap to listen' : '点击收听'");
    expect(content).toContain('home-podcast-cta inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 self-center');
    expect(content).toContain('whitespace-nowrap text-[clamp(1.75rem,7vw,2.6rem)]');
    expect(content).toContain('w-full flex-col items-start gap-2 sm:max-w-[410px] sm:flex-row');
  });

  test('podcast cta uses an explicit theme-safe class instead of bg-white utilities', () => {
    const home = read('src/components/HomeContent.tsx');
    const css = read('src/app/globals.css');
    expect(home).toContain('home-podcast-cta');
    expect(css).toContain('.home-podcast-cta');
    expect(css).toContain('.dark .home-podcast-cta');
  });

  test('tutorial carousel arrows stay hidden on small screens', () => {
    const content = read('src/components/HomeContent.tsx');
    expect(content).toContain('hidden -translate-y-1/2 sm:block');
  });

  test('top header controls keep compact mobile mode', () => {
    const content = read('src/components/LayoutContainers.tsx');
    expect(content).toContain('page-shell flex h-16 items-center justify-between');
    expect(content).toContain('hidden sm:inline');
    expect(content).toContain("aria-label={tCommon('submitTool')}");
  });

  test('shared page shell is used across key pages', () => {
    expect(read('src/components/HomeContent.tsx')).toContain('page-shell py-6');
    expect(read('src/components/SearchContent.tsx')).toContain('page-shell py-6');
    expect(read('src/components/UnifiedSearchContent.tsx')).toContain('page-shell py-6');
    expect(read('src/components/TutorialsContent.tsx')).toContain('page-shell relative z-10 py-6');
    expect(read('src/app/tools/[id]/ToolDetail.tsx')).toContain('page-shell py-6');
  });

  test('home category header contains merged stats instead of a standalone stats card', () => {
    const content = read('src/components/HomeContent.tsx');
    expect(content).not.toContain('<StatsDisplay />');
    expect(content).toContain("featured tools' : '精选AI工具");
    expect(content).toContain("utility tools' : '四次元小工具");
    expect(content).toContain("starter tutorials' : '萌新教程");
  });

  test('tutorial listing reuses shared tutorial card instead of a mobile-only variant', () => {
    const content = read('src/components/TutorialsContent.tsx');
    expect(content).toContain("import TutorialCard from './TutorialCard'");
    expect(content).not.toContain('useMediaQuery');
    expect(content).toContain('showRecommendReason={true}');
  });

  test('shared tutorial card contains responsive classes for both mobile and desktop', () => {
    const content = read('src/components/TutorialCard.tsx');
    expect(content).toContain('showDelete?: boolean');
    expect(content).toContain('showRecommendReason?: boolean');
    expect(content).toContain('h-28 w-full');
    expect(content).toContain('sm:h-36');
    expect(content).toContain('p-2.5 sm:p-4');
    expect(content).toContain('text-sm font-bold');
    expect(content).toContain('sm:text-lg');
  });

  test('tool grids keep a responsive multi-column fallback on mobile', () => {
    expect(read('src/components/ToolGrid.tsx')).toContain('min-[380px]:grid-cols-2');
    expect(read('src/components/ToolList.tsx')).toContain('min-[380px]:grid-cols-2');
  });
});
