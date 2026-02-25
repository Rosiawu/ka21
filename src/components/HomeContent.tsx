"use client"; // 标记为客户端组件，可以使用浏览器API和状态管理

// 引入React相关Hook和组件
import { useState, useRef, useEffect, useMemo } from 'react'; // React核心Hook
import {useTranslations} from 'next-intl';
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
import StatsDisplay from './StatsDisplay'; // 统计显示组件
import { HotSection } from '@/components/hot'; // 热门推荐区域组件
import SearchIntentPanel from './SearchIntentPanel'; // 搜索意图推荐组件
import { trackUserAction, trackPageView, setTag } from '@/utils/clarity'; // 埋点分析工具
import useDebounce from '@/hooks/useDebounce'; // 防抖Hook
import useHotkey from '@/hooks/useHotkey'; // 快捷键Hook

/**
 * 首页内容组件
 * - 展示工具导航的主要功能
 * - 包含搜索、分类、热门推荐等模块
 * - 支持键盘快捷键和响应式设计
 */
export default function HomeContent({ subtitle }: { subtitle?: string }) {
  const tHome = useTranslations('Home');
  const tCommon = useTranslations('Common');
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
  // ========== 状态管理 ==========
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState(''); // 搜索输入框的值
  const searchInputRef = useRef<HTMLInputElement>(null); // 搜索输入框的引用，用于聚焦操作
  
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
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true); // 是否启用自动轮播
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
  
  // 处理搜索表单提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 跟踪搜索事件
      trackUserAction('search', {
        query: searchQuery.trim(),
        search_source: 'home_page'
      });
      
      // 跳转到统一搜索页面，同时显示工具和教程结果
      router.push(`/unified-search?q=${encodeURIComponent(searchQuery.trim())}`);
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
      tutorial.category.toLowerCase().includes(query)
    ).slice(0, 6); // 显示匹配的前6个教程用于轮播
  }, [debouncedSearchQuery]);
  
  // 自动轮播功能
  useEffect(() => {
    // 只有在自动播放启用且有足够的教程时才启动轮播
    if (autoPlayEnabled && filteredTutorials.length > 3) {
      // 清除现有的定时器
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
      
      // 设置新的自动轮播定时器
      autoPlayIntervalRef.current = setInterval(() => {
        // 向右滚动到下一组教程
        if (tutorialSliderRef.current) {
          const cardsToShow = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
          const tutorialCardWidth = 288 + 16; // 教程卡片宽度(w-72 = 288px) + 间距
          
          // 计算下一个索引，确保循环轮播
          const nextIndex = (currentTutorialIndex + 1) % (filteredTutorials.length - cardsToShow + 1);
          setCurrentTutorialIndex(nextIndex);
          
          // 滚动到相应位置
          tutorialSliderRef.current.scrollTo({
            left: nextIndex * tutorialCardWidth,
            behavior: 'smooth'
          });
        }
      }, 7000); // 7秒轮播一次，给用户更多阅读时间
      
      return () => {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current);
        }
      };
    }
  }, [autoPlayEnabled, filteredTutorials.length, currentTutorialIndex]);
  
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
  
  // 搜索结果排序
  const filteredTools = useMemo(() => {
    if (!debouncedSearchQuery) return toolsList;
    const query = debouncedSearchQuery.toLowerCase();
    return toolsList.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [toolsList, debouncedSearchQuery]);

  const sortedTools = useMemo(() => {
    return applySorting(filteredTools, sortMethod);
  }, [filteredTools, sortMethod]);

  const handleSortChange = (method: SortMethod) => {
    setSortMethod(method);
  };
  
  return (
    <div className="relative overflow-hidden pb-24">
      {/* 背景装饰 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-3 sm:px-4 py-6">
        <div className="max-w-8xl mx-auto">
          {/* 主标题区域 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl md:text-5xl mb-2">
              <div className="flex items-center justify-center">
                <Logo size="large" />
              </div>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-700 dark:text-slate-300">
              {(() => {
                const text = subtitle ?? tHome('subtitle');
                if (process.env.NODE_ENV !== 'production') {
                  // eslint-disable-next-line no-console
                  console.info('[i18n][client] HomeContent subtitle =', text);
                }
                return text;
              })()}
            </p>
          </div>
          
          {/* 搜索栏 - 修改为表单提交到搜索页面 */}
          <div className="mb-4 relative max-w-lg mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {isSearchPending ? (
                  <svg className="w-5 h-5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                id="search"
                className={`block w-full p-3 pl-10 pr-16 text-md border-none ring-1 ring-slate-300 dark:ring-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 ${isSearchPending ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} dark:focus:ring-primary-400 transition-all`}
                placeholder={tHome('searchPlaceholder')}
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  trackUserAction('search_focus', {
                    search_source: 'home_page'
                  });
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="absolute inset-y-0 right-12 flex items-center pr-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white bg-primary-500 hover:bg-primary-600 rounded-r-lg px-4"
              >
                <span className="sr-only">搜索</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </form>
            {/* 搜索提示已移除 */}
          </div>

          <div className="mb-10 max-w-4xl mx-auto">
            <SearchIntentPanel
              query={searchQuery}
              onQuerySelect={handleIntentQuerySelect}
            />
          </div>
          
          {/* 添加工具和教程统计数据 */}
          <div className="mb-12 max-w-4xl mx-auto">
            <StatsDisplay />
          </div>
          
          {/* 热门推荐板块（显式传入本地化标题，规避上下文异常导致的错语种） */}
          <HotSection title={tHot('title')} subtitle={tHot('subtitle')} />
          
          {/* 萌新教程部分 - 水平滚动布局 */}
          <section id="tutorials" className={`slide-up mb-12 ${isSearching ? 'relative' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="inline-block mr-3 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-blue-500"></i>
                </span>
                {tHome('tutorials')}
                {isSearching && (
                  <span className="ml-3 text-sm font-normal bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                    {tHome('filtered')}
                  </span>
                )}
                <span className="hidden sm:inline-block ml-3 text-sm font-normal text-slate-500 dark:text-slate-400">{tHome('tutorialsSourceNote')}</span>
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
                  className="inline-flex items-center mr-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
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
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                    <i className="fas fa-search text-slate-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">{tHome('noTutorialsTitle')}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{tHome('noTutorialsHint')}</p>
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
                    onMouseEnter={() => setAutoPlayEnabled(false)}
                    onMouseLeave={() => setAutoPlayEnabled(true)}
                  >
                    <div className="flex gap-4 pb-4 pl-8 pr-8">
                      {/* 渲染教程卡片 */}
                      {filteredTutorials.map((tutorial) => (
                        <div key={tutorial.id} className="flex-shrink-0 w-72 h-full">
                          <a 
                            href={tutorial.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block h-full group"
                          >
                            <article className="tool-card bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary-300 border border-transparent">
                              <div className="relative w-full h-36 overflow-hidden bg-gradient-to-r from-gray-100 to-slate-200 dark:from-gray-800 dark:to-slate-900">
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
                                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="288" height="144" viewBox="0 0 288 144"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:%23764ba2;stop-opacity:1" /></linearGradient></defs><rect width="288" height="144" fill="url(%23grad)" /><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">教程图片</text></svg>';
                                    }}
                                  />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-2 left-2 z-10">
                                  <span className={`px-2 py-0.5 ${
                                    tutorial.category === '飞书多维表格' ? 'bg-blue-500' :
                                    tutorial.category === 'AI大模型' ? 'bg-purple-500' :
                                    tutorial.category === 'AI绘画' ? 'bg-pink-500' :
                                    tutorial.category === 'AI效率' ? 'bg-green-500' :
                                    tutorial.category === '商业应用' ? 'bg-orange-500' :
                                    tutorial.category === '学术研究' ? 'bg-indigo-500' :
                                    'bg-red-500'
                                  } text-white text-xs font-medium rounded-md`}>
                                    {tutorial.category}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="p-3 flex-grow">
                                <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{tutorial.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-y-1 mb-1">
                                  <span className="flex items-center mr-2">
                                    <i className="fas fa-calendar-alt mr-1"></i>
                                    {tutorial.publishDate}
                                  </span>
                                  <span className="flex items-center">
                                    <i className="fas fa-user-edit mr-1"></i>
                                    {tutorial.author}
                                  </span>
                                </p>
                                
                                {/* 推荐理由 */}
                                {tutorial.recommendReason && (
                                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded line-clamp-3 italic">
                                    <i className="fas fa-thumbs-up text-primary-500 mr-1"></i>
                                    {tutorial.recommendReason}
                                  </div>
                                )}
                                
                                <div className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center group-hover:translate-x-1 transition-transform duration-300 mt-1">
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
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                    <button 
                      className="bg-white/80 dark:bg-slate-800/80 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-3 rounded-full shadow-lg text-primary-600 dark:text-primary-400"
                      aria-label={tHome('scrollLeft')}
                      onClick={() => {
                        // 暂停自动播放
                        setAutoPlayEnabled(false);
                        
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
                        
                        // 7秒后重新启用自动播放
                        setTimeout(() => setAutoPlayEnabled(true), 7000);
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </div>
                  
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                    <button 
                      className="bg-white/80 dark:bg-slate-800/80 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-3 rounded-full shadow-lg text-primary-600 dark:text-primary-400"
                      aria-label={tHome('scrollRight')}
                      onClick={() => {
                        // 暂停自动播放
                        setAutoPlayEnabled(false);
                        
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
                        
                        // 7秒后重新启用自动播放
                        setTimeout(() => setAutoPlayEnabled(true), 7000);
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
                          // 暂停自动播放
                          setAutoPlayEnabled(false);
                          
                          const tutorialCardWidth = 288 + 16; // 卡片宽度(w-72 = 288px) + 间距
                          setCurrentTutorialIndex(index);
                          
                          const container = tutorialSliderRef.current;
                          if (container) {
                            container.scrollTo({
                              left: index * tutorialCardWidth,
                              behavior: 'smooth'
                            });
                          }
                          
                          // 7秒后重新启用自动播放
                          setTimeout(() => setAutoPlayEnabled(true), 7000);
                        }}
                        aria-label={tHome('jumpToTutorialPage', {index: index + 1})}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 指示更多内容的指示器 */}
              <div className="text-center mt-4 text-slate-400 text-sm animate-pulse">
                <i className="fas fa-chevron-down mr-1"></i>
                {tHome('scrollDownToViewTools')}
              </div>
            </div>
            
            <div className="mt-2 text-center sm:hidden">
              <Link href="/tutorials" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200">
                {tCommon('viewAll')} {tHome('tutorials')}
                <i className="fas fa-chevron-right ml-2"></i>
              </Link>
            </div>
          </section>
          
          {/* 工具分类列表 - 使用新的ToolCategorySection组件 */}
          {!isSearching && !isSearchPending && (
            <div className="mt-16 space-y-12">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{tHome('allCategoriesTitle')}</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  {tHome('allCategoriesDesc')}
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
