"use client"; // 标记为客户端组件，可以使用浏览器API和状态管理

// 引入React相关Hook和组件
import { useState, useRef, useEffect, useMemo } from 'react'; // React核心Hook
import {useLocale, useTranslations} from 'next-intl';
import ToolList from '@/components/ToolList'; // 工具列表组件
import toolsData from '@/data/tools.json'; // 工具数据JSON文件
import { Tool } from '@/lib/types'; // 工具类型定义
import { validateTools } from '@/lib/validate'; // 工具数据验证函数
import { useRouter } from '@/i18n/navigation'; // 国际化路由Hook
import Link from '@/i18n/Link'; // Locale-aware Link wrapper
import Image from 'next/image'; // Next.js图片组件
import Logo from './Logo'; // Logo组件
import { tutorials } from '@/data/tutorials'; // 教程数据
import { TOOL_CATEGORIES } from '@/data/toolCategories'; // 工具分类数据
import ToolCategorySection from './ToolCategorySection'; // 工具分类区域组件
import { sortByDefaultOrder } from '@/utils/sortTools'; // 默认排序工具函数
import ToolSortControls, { SortMethod } from './ToolSortControls'; // 排序控制组件
import { applySorting } from '@/utils/sortTools'; // 应用排序函数
import { getVisibleTools } from '@/utils/sortTools'; // 获取可见工具函数
import { HotSection } from '@/components/hot'; // 热门推荐区域组件
import SearchIntentPanel from './SearchIntentPanel'; // 搜索意图推荐组件
import DevLogPreviewSection from './DevLogPreviewSection';
import EventPreviewSection from './EventPreviewSection';
import DealsPreviewSection from './DealsPreviewSection';
import type { EventEntry } from '@/data/events';
import type { DealViewModel } from '@/lib/deals/types';
import { trackUserAction, trackPageView, setTag } from '@/utils/clarity'; // 埋点分析工具
import useDebounce from '@/hooks/useDebounce'; // 防抖Hook
import useHotkey from '@/hooks/useHotkey'; // 快捷键Hook
import { localizeTutorialCategory } from '@/utils/tutorials';
import { getCategoryColor } from '@/utils/tutorials';
import {
  getToolHiddenTaxonomyTags,
  getToolSearchAliasTokens,
  getTutorialHiddenTaxonomyTags,
  getTutorialSearchAliasTokens,
  matchesTaxonomyToken,
  serializeTagsForTelemetry,
} from '@/lib/coreTaxonomy';

/**
 * 首页内容组件
 * - 展示工具导航的主要功能
 * - 包含搜索、分类、热门推荐等模块
 * - 支持键盘快捷键和响应式设计
 */
export default function HomeContent({
  subtitle,
  initialEvents = [],
  initialDeals = [],
}: {
  subtitle?: string;
  initialEvents?: EventEntry[];
  initialDeals?: DealViewModel[];
}) {
  const isEn = useLocale() === 'en';
  const tHome = useTranslations('Home');
  const tCommon = useTranslations('Common');
  const podcastDashboardHref = '/podcast';
  // 返回首页时若存在保存的滚动位置，则恢复
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const shouldRestore = sessionStorage.getItem('restore_home_scroll');
        if (shouldRestore === '1') {
          const saved = parseInt(sessionStorage.getItem('home_scroll') || '0', 10);
          if (!Number.isNaN(saved) && saved > 0) {
            window.scrollTo(0, saved);
          }
          sessionStorage.removeItem('restore_home_scroll');
        }
      }
    } catch {}
  }, []);
  const tHot = useTranslations('Hot');
  const homeSubtitle = subtitle ?? tHome('subtitle');
  const mobileSubtitleParts = (() => {
    const separator = homeSubtitle.includes('，') ? '，' : homeSubtitle.includes(',') ? ',' : '';
    if (!separator) return [homeSubtitle];
    const [head, ...rest] = homeSubtitle.split(separator);
    return rest.length > 0 ? [`${head}${separator}`, rest.join(separator).trim()] : [homeSubtitle];
  })();
  const composerText = {
    label: isEn ? 'Conversation input' : '对话输入框',
    placeholder: isEn
      ? 'What do you want to do today? Tell me naturally and I will find tools and tutorials for you.'
      : '今天想做什么？像聊天一样告诉我，我来帮你找工具和教程。',
    mode: isEn ? 'Chat mode' : '对话模式',
    intent: isEn ? 'Intent matching enabled' : '意图匹配已开启',
    understanding: isEn ? 'Understanding your request' : '正在理解你的需求',
    clear: isEn ? 'Clear input' : '清空输入',
    send: isEn ? 'Send' : '发送',
    examples: isEn
      ? 'Try: storyboard for a short drama | write a launch post | tools that auto-summarize spreadsheets'
      : '试试这样问: 做短剧分镜 | 写一段发布文案 | 找能自动汇总表格的工具',
    tutorialImage: isEn ? 'Tutorial cover' : '教程图片',
  };
  const spotlightPodcast = {
    tag: isEn ? 'Featured Podcast' : '播客推荐',
    title: isEn ? 'Lamp Under The Light' : '灯下白',
    subtitle: isEn
      ? 'Xiaoyuzhou Podcast: real conversations from the AI community'
      : '小宇宙播客：走进 AI 圈的真实对话',
    description: isEn
      ? 'Choose your preferred platform and start listening right from the homepage.'
      : '点击任意播客节目图标即可收听。',
    mobileSubline: isEn ? 'Real conversations with AI leaders' : '点击图标收听AI圈高手真实访谈',
    cta: isEn ? 'Listen now' : '点击收听',
    note: isEn ? 'Open podcast page' : '点击打开节目页',
    logoAlt: isEn ? 'Lamp Under The Light podcast logo' : '灯下白播客 Logo',
  };
  const podcastPlatforms = [
    {
      id: 'xiaoyuzhou',
      name: '小宇宙',
      href: 'https://www.xiaoyuzhoufm.com/podcast/69a44f5aa19c08db64bbd8a7',
      logo: '/images/podcast/platforms/xiaoyuzhou.ico',
    },
    {
      id: 'apple',
      name: '苹果播客',
      href: 'https://podcasts.apple.com/cn/podcast/%E7%81%AF%E4%B8%8B%E7%99%BD/id1883429226',
      logo: '/images/podcast/platforms/apple.ico',
    },
    {
      id: 'lizhi',
      name: '荔枝',
      href: 'https://m.lizhi.fm/voicesheet/5500330523200853569',
      logo: '/images/podcast/platforms/lizhi.ico',
    },
    {
      id: 'ximalaya',
      name: '喜马拉雅',
      href: 'https://www.ximalaya.com/album/33817634',
      logo: '/images/podcast/platforms/ximalaya.ico',
    },
    {
      id: 'wangyiyun',
      name: '网易云音乐',
      href: 'https://music.163.com/#/djradio?id=1487456047',
      logo: '/images/podcast/platforms/wangyiyun.ico',
    },
    {
      id: 'qingting',
      name: '蜻蜓FM',
      href: 'https://m.qtfm.cn/vchannels/526838',
      logo: '/images/podcast/platforms/qingting.ico',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      href: 'https://www.youtube.com/channel/UC4vwgT8e3dYo0ra_bDqIq9A',
      brandIcon: 'fab fa-youtube',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      href: 'https://open.spotify.com/show/7s1L3Bl9QD3tWTmGnPW4y0?si=jNefx-5VRfiW8N9r-OD25Q',
      brandIcon: 'fab fa-spotify',
    },
  ] as const;
  // ========== 状态管理 ==========
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState(''); // 搜索输入框的值
  const searchInputRef = useRef<HTMLTextAreaElement>(null); // 搜索输入框的引用，用于聚焦操作
  
  // 数据加载状态
  const [isLoading, setIsLoading] = useState(true); // 是否正在加载数据
  const [error, setError] = useState<Error | null>(null); // 错误信息
  const [toolsList, setToolsList] = useState<Tool[]>([]); // 工具列表数据
  
  // Next.js路由Hook
  const router = useRouter();
  
  // 搜索相关派生状态：由输入值推导，避免不必要的本地状态
  // - isSearching: 使用防抖后的值是否非空
  // - isSearchPending: 输入与防抖值不一致表示仍在等待稳定

  // 教程轮播相关状态
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0); // 当前教程索引
  const tutorialSliderRef = useRef<HTMLDivElement>(null); // 教程轮播容器的引用
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null); // 自动轮播定时器的引用
  
  // ========== 计算属性和Hook ==========
  
  // 防抖处理搜索查询，延迟300毫秒，避免频繁搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // ========== 副作用处理 ==========
  
  // 加载工具数据并进行默认排序
  useEffect(() => {
    try {
      setIsLoading(true); // 设置加载状态为true
      
      // 确保数据结构有效，验证工具数据格式
      if (!validateTools(toolsData.tools)) {
        throw new Error('Invalid tools data structure');
      }
      
      // 使用排序工具函数对工具进行默认排序（使用displayOrder字段优先）
      // 先过滤可见工具，再进行排序
      const visibleTools = getVisibleTools(toolsData.tools); // 获取可见工具
      setToolsList(sortByDefaultOrder(visibleTools)); // 设置排序后的工具列表
      
      // 跟踪主页访问，用于数据分析
      trackPageView('首页', 'home'); // 记录页面访问
      setTag('page_type', 'home'); // 设置页面类型标签
      setTag('total_tools', visibleTools.length.toString()); // 设置工具总数标签
      const hiddenToolTags = visibleTools.flatMap((tool) => getToolHiddenTaxonomyTags(tool));
      const hiddenTutorialTags = tutorials.flatMap((tutorial) => getTutorialHiddenTaxonomyTags(tutorial));
      setTag('taxonomy_version', 'difficulty-scenario-v1');
      setTag('hidden_tool_tag_count', String(new Set(hiddenToolTags).size));
      setTag('hidden_tutorial_tag_count', String(new Set(hiddenTutorialTags).size));
      setTag('hidden_tool_tags_sample', serializeTagsForTelemetry(hiddenToolTags));
      setTag('hidden_tutorial_tags_sample', serializeTagsForTelemetry(hiddenTutorialTags));
      
      setIsLoading(false); // 设置加载状态为false
    } catch (err) {
      console.error('Error loading tools:', err); // 输出错误信息到控制台
      setError(err instanceof Error ? err : new Error('Unknown error loading tools')); // 设置错误状态
      setIsLoading(false); // 确保加载状态为false
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次
  
  // 键盘快捷键（Ctrl/Cmd + K 聚焦，Esc 在输入聚焦时清空）
  useHotkey([
    {
      combo: 'ctrl+k',
      handler: () => searchInputRef.current?.focus(),
    },
    {
      combo: 'esc',
      handler: () => {
        if (document.activeElement === searchInputRef.current) {
          setSearchQuery('');
        }
      },
    },
  ]);
  
  const executeHomeSearch = (rawQuery: string, source: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    trackUserAction('search', {
      query: trimmed,
      search_source: source,
    });
    router.push(`/unified-search?q=${encodeURIComponent(trimmed)}`);
  };

  // 处理搜索表单提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeHomeSearch(searchQuery, 'home_page');
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeHomeSearch(searchQuery, 'home_page_enter');
    }
  };

  const handleIntentQuerySelect = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    trackUserAction('search_intent_click', {
      query: trimmed,
      search_source: 'home_intent_panel'
    });
    router.push(`/unified-search?q=${encodeURIComponent(trimmed)}`);
  };

  // 由数据推导出的 UI 状态（不额外维护本地状态）
  const isSearching = debouncedSearchQuery.trim().length > 0;
  const isSearchPending = searchQuery.trim().length > 0 && searchQuery !== debouncedSearchQuery;
  
  // 实时过滤萌新教程
  const filteredTutorials = useMemo(() => {
    if (!debouncedSearchQuery) {
      // 按发布日期排序，最新的教程优先显示
      const sortedTutorials = [...tutorials].sort((a, b) => {
        const dateA = new Date(a.publishDate);
        const dateB = new Date(b.publishDate);
        return dateB.getTime() - dateA.getTime(); // 降序排列，最新的在前
      });
      return sortedTutorials.slice(0, 6); // 显示最新的6个教程用于轮播
    }
    
    const query = debouncedSearchQuery.toLowerCase();
    return tutorials.filter(tutorial => 
      tutorial.title.toLowerCase().includes(query) || 
      tutorial.description.toLowerCase().includes(query) ||
      tutorial.author.toLowerCase().includes(query) ||
      tutorial.category.toLowerCase().includes(query) ||
      matchesTaxonomyToken(query, getTutorialSearchAliasTokens(tutorial))
    ).slice(0, 6); // 显示匹配的前6个教程用于轮播
  }, [debouncedSearchQuery]);
  
  // 首页不再自动轮播，避免移动端和某些浏览器出现意外跳动或回顶
  useEffect(() => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, []);
  
  // 窗口大小变化时重新计算轮播
  useEffect(() => {
    const handleResize = () => {
      // 重置轮播位置
      if (tutorialSliderRef.current) {
        tutorialSliderRef.current.scrollTo({
          left: 0,
          behavior: 'auto'
        });
        setCurrentTutorialIndex(0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 没有匹配的教程时显示的提示
  const noTutorialsMatch = isSearching && filteredTutorials.length === 0;
  
  // 根据分类对工具进行分组
  const toolsByCategory = useMemo(() => {
    if (isLoading || error) return {};
    
    const groupedTools: Record<string, Tool[]> = {};
    
    // 初始化所有工具分类
    TOOL_CATEGORIES.forEach(category => {
      groupedTools[category.id] = [];
    });
    
    // 将工具按分类分组
    toolsList.forEach(tool => {
      const category = tool.toolCategory || 'misc';
      if (!groupedTools[category]) {
        groupedTools[category] = [];
      }
      groupedTools[category].push(tool);
    });
    
    return groupedTools;
  }, [toolsList, isLoading, error]);
  
  const [sortMethod, setSortMethod] = useState<SortMethod>('default');
  const utilsCount = useMemo(
    () => toolsList.filter((tool) => tool.toolCategory === 'utils').length,
    [toolsList]
  );
  const coreToolCount = toolsList.length - utilsCount;
  const tutorialCount = tutorials.length;
  
  // 搜索结果排序
  const filteredTools = useMemo(() => {
    if (!debouncedSearchQuery) return toolsList;
    const query = debouncedSearchQuery.toLowerCase();
    return toolsList.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.tags.some(tag => tag.toLowerCase().includes(query)) ||
      matchesTaxonomyToken(query, getToolSearchAliasTokens(tool))
    );
  }, [toolsList, debouncedSearchQuery]);

  const sortedTools = useMemo(() => {
    return applySorting(filteredTools, sortMethod);
  }, [filteredTools, sortMethod]);

  const handleSortChange = (method: SortMethod) => {
    setSortMethod(method);
  };
  
  return (
    <div className="relative overflow-x-clip pb-24 bg-transparent">
      
      <div className="page-shell py-6">
        <div className="max-w-8xl mx-auto">
          {/* 主标题区域 */}
          <div className="mb-8">
            <div className="mx-auto max-w-5xl">
              <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-4">
                <div className="sm:block">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl md:text-5xl">
                    <div
                      className="relative flex h-[212px] w-full items-center justify-center rounded-3xl border bg-white px-3 pb-8 pt-3 shadow-[0_10px_24px_rgba(15,23,42,0.10)] sm:mx-0 sm:h-[220px] sm:w-[220px] sm:px-4 sm:pb-10 sm:pt-4"
                      style={{ borderColor: 'rgba(200,180,125,0.55)', backgroundColor: '#ffffff' }}
                    >
                      <Logo size="large" variant="black" className="dark:hidden" />
                      <Logo size="large" variant="white" className="hidden dark:flex" />
                      <p className="absolute inset-x-3 bottom-4 text-center text-[12px] leading-snug text-gray-700 dark:text-gray-300 sm:inset-x-4 sm:bottom-5 sm:text-[13px]">
                        <span className="block">{mobileSubtitleParts[0]}</span>
                        {mobileSubtitleParts[1] ? <span className="block">{mobileSubtitleParts[1]}</span> : null}
                      </p>
                    </div>
                  </h1>
                </div>

                <div
                  className="inline-flex h-[212px] w-full flex-col justify-between gap-2 rounded-[2rem] border border-[#c8b47d]/55 bg-[linear-gradient(120deg,#050910_0%,#1B2332_48%,#080C14_100%)] px-3 py-2.5 text-left text-white shadow-[0_14px_28px_rgba(2,6,23,0.35)] sm:h-[220px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3"
                  aria-label={`${spotlightPodcast.title} - ${spotlightPodcast.note}`}
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    trackUserAction('podcast_dashboard_click', {
                      entry: 'home_podcast_card',
                      podcast: 'dengxiaobai',
                    });
                    router.push(podcastDashboardHref);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      trackUserAction('podcast_dashboard_click', {
                        entry: 'home_podcast_card_keyboard',
                        podcast: 'dengxiaobai',
                      });
                      router.push(podcastDashboardHref);
                    }
                  }}
                >
                  <span className="flex min-w-0 w-full flex-col items-start gap-1.5 sm:max-w-[410px] sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex items-center gap-2.5 sm:block">
                      <span className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] border border-white/20 bg-black/45 sm:h-[84px] sm:w-[84px] sm:rounded-[1.25rem]">
                        <Image
                          src="/images/podcast/dengxiabai-logo-official.png"
                          alt={spotlightPodcast.logoAlt}
                          width={72}
                          height={72}
                          className="h-[48px] w-[48px] object-cover object-[50%_42%] sm:h-[76px] sm:w-[76px]"
                        />
                      </span>
                      <span className="inline-flex rounded-full border border-[#d5bf87]/65 bg-[#d7b971]/10 px-2 py-[2px] text-[10px] font-semibold text-[#e7cd8b] sm:hidden">
                        {spotlightPodcast.tag}
                      </span>
                    </span>

                    <span className="min-w-0 w-full leading-tight">
                      <span className="hidden rounded-full border border-[#d5bf87]/65 bg-[#d7b971]/10 px-2.5 py-[2px] text-[11px] font-semibold text-[#e7cd8b] sm:inline-flex">
                        {spotlightPodcast.tag}
                      </span>
                      <span className="mt-0.5 block whitespace-nowrap text-[clamp(1.5rem,6.4vw,2.35rem)] leading-[0.94] font-extrabold tracking-tight text-white sm:mt-1.5 sm:text-[48px] sm:leading-[0.92]">
                        {spotlightPodcast.title}
                      </span>
                      <span className="mt-1 hidden line-clamp-1 text-[12px] font-semibold text-gray-200 sm:block sm:text-[16px]">
                        {spotlightPodcast.subtitle}
                      </span>
                      <span className="mt-1 hidden line-clamp-2 text-[11px] text-gray-300/85 sm:block sm:text-sm">
                        {spotlightPodcast.description}
                      </span>
                      <span className="mt-0.5 block line-clamp-1 text-[11px] font-semibold text-gray-200 sm:hidden">
                        {spotlightPodcast.mobileSubline}
                      </span>
                    </span>
                  </span>

                  <span className="home-podcast-platforms grid w-full shrink-0 grid-cols-4 gap-1.5 sm:w-[312px] sm:grid-cols-4 sm:gap-2">
                    {podcastPlatforms.map((platform) => (
                      <a
                        key={platform.id}
                        href={platform.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => {
                          event.stopPropagation();
                          trackUserAction('podcast_entry_click', {
                            entry: `home_podcast_platform_${platform.id}`,
                            podcast: 'dengxiaobai',
                            platform: platform.id,
                          });
                        }}
                        className={`home-podcast-platform-chip home-podcast-platform-${platform.id}`}
                        aria-label={`${spotlightPodcast.title} - ${platform.name}`}
                        title={platform.name}
                      >
                        {'logo' in platform ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={platform.logo}
                            alt={`${platform.name} logo`}
                            className="home-podcast-platform-logo"
                            loading="lazy"
                          />
                        ) : (
                          <i className={`home-podcast-platform-brand ${platform.brandIcon}`} aria-hidden="true"></i>
                        )}
                      </a>
                    ))}
                  </span>
                </div>
              </div>

            </div>
          </div>
          
          {/* 对话式输入框 */}
          <div className="mb-6 relative max-w-5xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="rounded-[2rem] border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm px-5 py-4 sm:px-6 sm:py-5 transition-all focus-within:border-primary-400 focus-within:shadow-[0_14px_35px_rgba(224,107,107,0.12)]"
            >
              <label htmlFor="search" className="sr-only">{composerText.label}</label>
              <textarea
                ref={searchInputRef}
                id="search"
                rows={2}
                className="w-full resize-none bg-transparent text-base sm:text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
                placeholder={composerText.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onFocus={() => {
                  trackUserAction('search_focus', {
                    search_source: 'home_page',
                  });
                }}
              />

              <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700">
                    <i className="fas fa-comments text-[11px]"></i>
                    {composerText.mode}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-100 dark:border-primary-800/60">
                    <i className="fas fa-wand-magic-sparkles text-[11px]"></i>
                    {composerText.intent}
                  </span>
                  {isSearchPending && (
                    <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></span>
                      {composerText.understanding}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label={composerText.clear}
                    >
                      <i className="fas fa-xmark"></i>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="h-11 px-4 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white dark:bg-primary-500 dark:text-white enabled:hover:bg-gray-700 dark:enabled:hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-sm">{composerText.send}</span>
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {composerText.examples}
              </p>
            </form>
          </div>

          <div className="mb-10 max-w-4xl mx-auto">
            <SearchIntentPanel
              query={searchQuery}
              onQuerySelect={handleIntentQuerySelect}
            />
          </div>

          {/* 热门推荐板块（显式传入本地化标题，规避上下文异常导致的错语种） */}
          <HotSection title={tHot('title')} subtitle={tHot('subtitle')} />

          {/* 萌新教程部分 - 水平滚动布局 */}
          <section id="tutorials" className={`slide-up mb-12 ${isSearching ? 'relative' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-serif flex items-center">
                <span className="inline-block mr-3 w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-rose-400"></i>
                </span>
                {tHome('tutorials')}
                {isSearching && (
                  <span className="ml-3 text-sm font-normal bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                    {tHome('filtered')}
                  </span>
                )}
                <span className="hidden sm:inline-block ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">{tHome('tutorialsSourceNote')}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    // 使用DOM API直接操作，避免增加状态管理负担
                    const tutorialContent = document.querySelector('#tutorial-content');
                    const collapseIcon = document.querySelector('#collapse-icon');
                    if (tutorialContent && collapseIcon) {
                      if (tutorialContent.classList.contains('hidden')) {
                        tutorialContent.classList.remove('hidden');
                        collapseIcon.classList.remove('fa-chevron-down');
                        collapseIcon.classList.add('fa-chevron-up');
                      } else {
                        tutorialContent.classList.add('hidden');
                        collapseIcon.classList.remove('fa-chevron-up');
                        collapseIcon.classList.add('fa-chevron-down');
                      }
                    }
                  }}
                  className="inline-flex items-center mr-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <i id="collapse-icon" className="fas fa-chevron-up mr-1 transition-transform duration-200"></i>
                  <span className="hidden sm:inline">{tHome('collapse')}</span>
                </button>
                <Link href="/tutorials" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 hidden sm:flex items-center">
                  {tCommon('viewAll')}
                  <i className="fas fa-arrow-right ml-1 text-xs"></i>
                </Link>
              </div>
            </div>
            
            <div id="tutorial-content">
              {/* 没有匹配的教程时显示提示 */}
              {noTutorialsMatch ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                    <i className="fas fa-search text-gray-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{tHome('noTutorialsTitle')}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{tHome('noTutorialsHint')}</p>
                  <Link 
                    href="/tutorials" 
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    {tHome('browseAllTutorials')}
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  {/* 水平滚动教程卡片容器 */}
                  <div 
                    className="overflow-x-auto hide-scrollbar py-4 px-2"
                    ref={tutorialSliderRef}
                  >
                    <div className="flex gap-4 pb-4 pl-8 pr-8">
                      {/* 渲染教程卡片 */}
                      {filteredTutorials.map((tutorial) => (
                        <div key={tutorial.id} className="flex-shrink-0 w-72">
                          <a 
                            href={tutorial.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block group"
                          >
                            <article className="tool-card bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden h-[400px] flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary-300 border border-transparent">
                              <div className="relative w-full h-36 overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Image 
                                    src={tutorial.imageUrl}
                                    alt={tutorial.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 288px"
                                    className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cmVjdCBpZD0iciIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiNmNGY0ZjUiIC8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIwLjU7MTswLjUiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPjwvc3ZnPg=="
                                    onError={(e) => {
                                      // 图片加载失败时使用CSS生成的占位图
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null; // 防止无限循环
                                      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="288" height="144" viewBox="0 0 288 144"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:%23764ba2;stop-opacity:1" /></linearGradient></defs><rect width="288" height="144" fill="url(%23grad)" /><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">${composerText.tutorialImage}</text></svg>`;
                                    }}
                                  />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-2 left-2 z-10">
                                  <span className={`px-2 py-0.5 ${getCategoryColor(tutorial.primaryScenario || tutorial.category)} text-white text-xs font-medium rounded-md`}>
                                    {localizeTutorialCategory(tutorial.primaryScenario || tutorial.category, isEn ? 'en' : 'zh')}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="p-2.5 flex min-h-0 flex-1 flex-col">
                                <h3 className="min-h-[2.8rem] font-bold text-base mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{tutorial.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                  <span className="flex items-center shrink-0">
                                    <i className="fas fa-calendar-alt mr-1"></i>
                                    {tutorial.publishDate}
                                  </span>
                                  <span className="flex items-center min-w-0 truncate">
                                    <i className="fas fa-user-edit mr-1"></i>
                                    <span className="truncate">{tutorial.author}</span>
                                  </span>
                                </p>
                                
                                {/* 推荐理由 */}
                                {tutorial.recommendReason && (
                                  <div className="mt-1 h-[62px] text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/30 p-1.5 rounded line-clamp-3 italic overflow-hidden">
                                    <i className="fas fa-thumbs-up text-primary-500 mr-1"></i>
                                    {tutorial.recommendReason}
                                  </div>
                                )}
                                {!tutorial.recommendReason && <div className="mt-1 h-[62px]" aria-hidden="true"></div>}
                                
                                <div className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center group-hover:translate-x-1 transition-transform duration-300 mt-auto pt-1.5">
                                  {tHome('readMore')}
                                  <i className="fas fa-arrow-right ml-1 group-hover:ml-2 transition-all duration-300"></i>
                                </div>
                              </div>
                            </article>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 滚动指示器和按钮 */}
                  <div className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                    <button 
                      className="bg-white/80 dark:bg-gray-800/80 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-3 rounded-full shadow-lg text-primary-600 dark:text-primary-400"
                      aria-label={tHome('scrollLeft')}
                      onClick={() => {
                        // 计算教程卡片宽度
                        const tutorialCardWidth = 288 + 16; // 教程卡片宽度(w-72 = 288px) + 间距
                        
                        // 计算前一个索引，确保不会小于0
                        const prevIndex = Math.max(0, currentTutorialIndex - 1);
                        setCurrentTutorialIndex(prevIndex);
                        
                        // 滚动到相应位置
                        const container = tutorialSliderRef.current;
                        if (container) {
                          container.scrollTo({
                            left: prevIndex * tutorialCardWidth,
                            behavior: 'smooth'
                          });
                        }
                        
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </div>
                  
                  <div className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                    <button 
                      className="bg-white/80 dark:bg-gray-800/80 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-3 rounded-full shadow-lg text-primary-600 dark:text-primary-400"
                      aria-label={tHome('scrollRight')}
                      onClick={() => {
                        // 计算教程卡片宽度
                        const tutorialCardWidth = 288 + 16; // 教程卡片宽度(w-72 = 288px) + 间距
                        
                        // 计算下一个索引，确保不会超出范围
                        const nextIndex = Math.min(
                          filteredTutorials.length - (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1),
                          currentTutorialIndex + 1
                        );
                        setCurrentTutorialIndex(nextIndex);
                        
                        // 滚动到相应位置
                        const container = tutorialSliderRef.current;
                        if (container) {
                          container.scrollTo({
                            left: nextIndex * tutorialCardWidth,
                            behavior: 'smooth'
                          });
                        }
                        
                      }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                  
                  {/* 添加轮播指示器 */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2 py-2">
                    {Array.from({ length: Math.max(1, filteredTutorials.length - 2) }).map((_, index) => (
                      <button 
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          currentTutorialIndex === index 
                            ? 'w-4 bg-primary-500' 
                            : 'w-2 bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => {
                          const tutorialCardWidth = 288 + 16; // 卡片宽度(w-72 = 288px) + 间距
                          setCurrentTutorialIndex(index);
                          
                          const container = tutorialSliderRef.current;
                          if (container) {
                            container.scrollTo({
                              left: index * tutorialCardWidth,
                              behavior: 'smooth'
                            });
                          }
                          
                        }}
                        aria-label={tHome('jumpToTutorialPage', {index: index + 1})}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 指示更多内容的指示器 */}
              <div className="text-center mt-4 text-gray-400 text-sm animate-pulse">
                <i className="fas fa-chevron-down mr-1"></i>
                {tHome('scrollDownToViewTools')}
              </div>
            </div>
            
            <div className="mt-2 text-center sm:hidden">
              <Link href="/tutorials" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                {tCommon('viewAll')} {tHome('tutorials')}
                <i className="fas fa-chevron-right ml-2"></i>
              </Link>
            </div>
          </section>
          {!isSearching && !isSearchPending && <DealsPreviewSection isEn={isEn} deals={initialDeals} />}

          {!isSearching && !isSearchPending && <EventPreviewSection isEn={isEn} events={initialEvents} />}

          {!isSearching && !isSearchPending && <DevLogPreviewSection isEn={isEn} />}

          {/* 工具分类列表 - 使用新的ToolCategorySection组件 */}
          {!isSearching && !isSearchPending && (
            <div className="mt-16 space-y-12">
              <div className="text-center">
                <h2 id="all-tools-categories" className="text-2xl font-bold font-serif text-gray-900 dark:text-gray-100 mb-2">{tHome('allCategoriesTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {tHome('allCategoriesDesc')}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center">
                    <span className="mr-1.5 text-xl font-bold text-primary-600 dark:text-primary-400">{coreToolCount}</span>
                    {isEn ? 'featured tools' : '精选AI工具'}
                  </span>
                  <span className="inline-flex items-center">
                    <span className="mr-1.5 text-xl font-bold text-primary-600 dark:text-primary-400">{utilsCount}</span>
                    {isEn ? 'utility tools' : '四次元小工具'}
                  </span>
                  <span className="inline-flex items-center">
                    <span className="mr-1.5 text-xl font-bold text-primary-600 dark:text-primary-400">{tutorialCount}</span>
                    {isEn ? 'starter tutorials' : '萌新教程'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {isEn ? 'Low-value listings are removed. Only useful AI tools stay.' : '末位淘汰，只留好用的AI牛马'}
                </p>
              </div>
              
              <div className="space-y-12">
                {TOOL_CATEGORIES.map(category => {
                  const categoryTools = toolsByCategory[category.id] || [];
                  // 只显示有工具的分类
                  if (categoryTools.length === 0) return null;
                  
                  return (
                    <ToolCategorySection 
                      key={category.id}
                      category={category}
                      tools={categoryTools}
                      showAll={false}
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 搜索结果 - 使用ToolList组件展示 */}
          {(isSearching || isSearchPending) && (
            <div className="mt-8">
              <ToolSortControls currentSort={sortMethod} onSortChange={handleSortChange} />
              <ToolList 
                tools={sortedTools} 
                initialSearchQuery={debouncedSearchQuery}
                isLoading={isLoading || isSearchPending}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
