"use client"; // 标记为客户端组件，可以使用浏览器API和状态管理

// 引入React相关Hook和组件
import { useState, useEffect, useRef, useMemo } from 'react'; // React核心Hook
import { useSearchParams } from 'next/navigation'; // Next.js搜索参数Hook
import { useRouter } from '@/i18n/navigation'; // 国际化路由Hook
import ToolCard from '@/components/ToolCard'; // 工具卡片组件
import toolsData from '@/data/tools.json'; // 工具数据JSON文件
import { Tool } from '@/lib/types'; // 工具类型定义
import { validateTools } from '@/lib/validate'; // 工具数据验证函数
import { tutorials, Tutorial } from '@/data/tutorials'; // 教程数据和类型
import TutorialCard from '@/components/TutorialCard'; // 教程卡片组件
import ToolSortControls, { SortMethod } from './ToolSortControls'; // 排序控制组件
import { applySorting, getVisibleTools } from '@/utils/sortTools'; // 排序和过滤工具函数
import useHotkey from '@/hooks/useHotkey'; // 快捷键Hook
import SearchIntentPanel from '@/components/SearchIntentPanel'; // 搜索意图推荐
import { trackUserAction } from '@/utils/clarity'; // 搜索行为埋点
import { useLocale } from 'next-intl';
import { getToolSearchAliasTokens, getTutorialSearchAliasTokens, matchesTaxonomyToken } from '@/lib/coreTaxonomy';

/**
 * 统一搜索内容组件
 * - 同时展示工具和教程的搜索结果
 * - 支持实时搜索和排序功能
 * - 集成键盘快捷键支持
 * - 使用抽取后的通用 TutorialCard 组件
 */
export default function UnifiedSearchContent() {
  const isEn = useLocale() === 'en';
  // 开发环境调试日志
  if (process.env.NODE_ENV !== 'production') {
    console.info('[UnifiedSearchContent] render start'); // 组件渲染开始日志
  }
  
  // ========== 路由和URL处理 ==========
  
  // 从URL获取搜索查询参数
  const searchParams = useSearchParams(); // Next.js搜索参数Hook
  const router = useRouter(); // Next.js路由Hook
  const searchQuery = searchParams.get('q') || ''; // 获取URL中的查询参数q，如果没有则为空字符串
  
  // 开发环境调试日志
  if (process.env.NODE_ENV !== 'production') {
    console.info('[UnifiedSearchContent] searchQuery', searchQuery); // 输出搜索查询日志
  }
  
  // ========== 状态管理 ==========
  
  // 输入和搜索状态
  const [inputValue, setInputValue] = useState(searchQuery); // 输入框的值，初始为URL中的查询参数
  const [isLoading, setIsLoading] = useState(true); // 是否正在加载数据
  const searchInputRef = useRef<HTMLTextAreaElement>(null); // 搜索输入框的引用，用于聚焦操作
  
  // 搜索结果状态
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]); // 过滤后的工具列表
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]); // 过滤后的教程列表
  
  // 排序相关状态
  const [sortMethod, setSortMethod] = useState<SortMethod>('recommend'); // 排序方式，默认为推荐排序
  const [sortedFilteredTools, setSortedFilteredTools] = useState<Tool[]>([]); // 排序后的工具列表
  const text = {
    dataValidationFailed: isEn ? 'Tool data validation failed' : '工具数据验证失败',
    titlePrefix: isEn ? 'Search Results' : '搜索结果',
    titleDefault: isEn ? 'Search Tools and Tutorials' : '搜索工具和教程',
    subtitleFound: (count: number) => (isEn ? `Found ${count} results` : `找到 ${count} 个结果`),
    subtitleDefault: isEn ? 'Enter keywords to search tools and tutorials' : '输入关键词搜索工具和教程',
    composerLabel: isEn ? 'Conversation input' : '对话输入框',
    placeholder: isEn
      ? 'Describe your task directly, for example: I want to create a short drama script.'
      : '把你的任务直接说出来，比如：我想做一个短剧脚本。',
    mode: isEn ? 'Chat mode' : '对话模式',
    intent: isEn ? 'Intent understanding' : '智能意图理解',
    clear: isEn ? 'Clear input' : '清空输入',
    send: isEn ? 'Send' : '发送',
    examples: isEn
      ? 'Example: Build a short-video production workflow | Best AI writing tools for beginners'
      : '示例提问: 帮我做一个短视频创作流程 | 适合小白的 AI 写作工具有哪些',
    loading: isEn ? 'Searching...' : '正在搜索...',
    noResultTitle: isEn ? 'No matching results found' : '没有找到相关结果',
    noResultHint: isEn
      ? 'Try different keywords, or browse tool categories to find what you need.'
      : '尝试使用不同的关键词，或者浏览我们的工具分类以找到您需要的内容。',
    tools: isEn ? 'Tools' : '工具',
    tutorials: isEn ? 'Tutorials' : '教程',
    resultCount: (count: number) => (isEn ? `${count} results` : `${count}个结果`),
  };
  
  // ========== 数据处理 ==========
  
  // 确保工具数据符合类型定义
  const allTools = toolsData.tools as Tool[]; // 将工具数据转换为Tool类型数组
  if (!validateTools(allTools)) { // 验证工具数据格式
    throw new Error(text.dataValidationFailed); // 如果验证失败则抛出错误
  }

  // 过滤可见工具并使用 useMemo 缓存，以避免每次渲染都创建新数组
  const tools = useMemo(() => getVisibleTools(allTools), [allTools]); // 获取可见工具列表并缓存
  
  // ========== 副作用处理 ==========
  
  // 加载工具数据
  useEffect(() => {
    try {
      setIsLoading(true); // 设置加载状态为true
      // 使用多级排序对工具进行初始排序
      setIsLoading(false); // 设置加载状态为false
    } catch (err) {
      console.error('Error loading tools:', err); // 输出错误信息到控制台
      setIsLoading(false); // 确保加载状态为false
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次
  
  // 搜索框自动聚焦
  useEffect(() => {
    if (searchInputRef.current) { // 确保输入框引用存在
      searchInputRef.current.focus(); // 自动聚焦到搜索框
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次
  
  // ========== 事件处理函数 ==========
  
  const executeUnifiedSearch = (rawQuery: string, source: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    trackUserAction('search', {
      query: trimmed,
      search_source: source
    });
    router.push(`/unified-search?q=${encodeURIComponent(trimmed)}`);
  };
  
  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认提交行为
    executeUnifiedSearch(inputValue, 'unified_search');
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setInputValue('');
      router.push('/unified-search');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeUnifiedSearch(inputValue, 'unified_search_enter');
    }
  };

  const handleIntentQuerySelect = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    trackUserAction('search_intent_click', {
      query: trimmed,
      search_source: 'unified_search_panel'
    });
    router.push(`/unified-search?q=${encodeURIComponent(trimmed)}`);
  };
  
  // ========== 快捷键支持 ==========
  
  // 快捷键：Ctrl/Cmd + K 聚焦搜索框
  useHotkey([
    { combo: 'ctrl+k', handler: () => searchInputRef.current?.focus() }, // Ctrl+K聚焦搜索框
  ]);
  
  // ========== 搜索和过滤逻辑 ==========
  
  // 根据搜索查询过滤工具和教程
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[UnifiedSearchContent] effect filter', searchQuery); // 开发环境调试日志
    }
    
    if (!searchQuery) { // 如果没有搜索查询
      setFilteredTools([]); // 清空过滤后的工具列表
      setFilteredTutorials([]); // 清空过滤后的教程列表
      return; // 提前返回
    }
    
    const query = searchQuery.toLowerCase(); // 将查询转换为小写，便于匹配
    
    // 过滤工具：匹配名称、描述或标签
    const matchedTools = tools.filter(tool => 
      tool.name.toLowerCase().includes(query) || // 工具名称包含查询词
      tool.description.toLowerCase().includes(query) || // 工具描述包含查询词
      (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(query))) || // 工具标签包含查询词
      matchesTaxonomyToken(query, getToolSearchAliasTokens(tool))
    );
    
    // 过滤教程：匹配标题、描述、作者或分类
    const matchedTutorials = tutorials.filter(tutorial => 
      tutorial.title.toLowerCase().includes(query) || // 教程标题包含查询词
      tutorial.description.toLowerCase().includes(query) || // 教程描述包含查询词
      tutorial.author.toLowerCase().includes(query) || // 教程作者包含查询词
      tutorial.category.toLowerCase().includes(query) || // 教程分类包含查询词
      matchesTaxonomyToken(query, getTutorialSearchAliasTokens(tutorial))
    );
    
    setFilteredTools(matchedTools); // 设置过滤后的工具列表
    setFilteredTutorials(matchedTutorials); // 设置过滤后的教程列表
  }, [searchQuery, tools]); // 依赖搜索查询和工具列表
  
  // ========== 排序逻辑 ==========
  
  // 根据排序方式对过滤后的工具进行排序
  useEffect(() => {
    if (!filteredTools.length) { // 如果没有过滤后的工具
      setSortedFilteredTools([]); // 清空排序后的工具列表
      return; // 提前返回
    }
    
    // 使用applySorting函数简化排序逻辑
    const sortedTools = applySorting(filteredTools, sortMethod); // 应用排序方法
    setSortedFilteredTools(sortedTools); // 设置排序后的工具列表
  }, [filteredTools, sortMethod]); // 依赖过滤后的工具列表和排序方法
  
  // ========== 事件处理函数 ==========
  
  // 处理排序方式变更
  const handleSortChange = (method: SortMethod) => {
    setSortMethod(method); // 更新排序方法
  };
  
  // ========== 计算属性 ==========
  
  // 搜索结果统计
  const totalResults = filteredTools.length + filteredTutorials.length; // 总结果数量
  const hasTools = filteredTools.length > 0; // 是否有工具结果
  const hasTutorials = filteredTutorials.length > 0; // 是否有教程结果
  const hasNoResults = totalResults === 0 && searchQuery.length > 0 && !isLoading; // 是否无结果
  
  // ========== 渲染组件 ==========
  
  return (
    <div className="relative overflow-hidden"> {/* 主容器，相对定位，隐藏溢出 */}
      {/* 背景装饰 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div> {/* 右上角背景装饰 */}
      <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div> {/* 左下角背景装饰 */}
      
      <div className="container mx-auto px-3 sm:px-4 py-6"> {/* 内容容器 */}
        <div className="max-w-8xl mx-auto"> {/* 最大宽度容器 */}
          {/* 页面标题 */}
          <div className="mb-8 text-center"> {/* 标题区域 */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl mb-2"> {/* 主标题 */}
              {searchQuery ? ( // 如果有搜索查询
                <>
                  {text.titlePrefix}: <span className="text-primary-600 dark:text-primary-400">&quot;{searchQuery}&quot;</span>
                </>
              ) : (
                <>{text.titleDefault}</>
              )}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {totalResults > 0 ? text.subtitleFound(totalResults) : text.subtitleDefault}
            </p>
          </div>
          
          {/* 对话式输入框 */}
          <div className="mb-8 relative max-w-5xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-slate-300/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 shadow-[0_10px_30px_rgba(15,23,42,0.10)] dark:shadow-[0_10px_30px_rgba(2,6,23,0.45)] backdrop-blur-sm px-5 py-4 sm:px-6 sm:py-5 transition-all focus-within:border-primary-400 focus-within:shadow-[0_14px_35px_rgba(59,130,246,0.18)]"
            >
              <label htmlFor="search" className="sr-only">{text.composerLabel}</label>
              <textarea
                ref={searchInputRef}
                id="search"
                rows={2}
                className="w-full resize-none bg-transparent text-base sm:text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                placeholder={text.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onFocus={() => {
                  trackUserAction('search_focus', {
                    search_source: 'unified_search'
                  });
                }}
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                    <i className="fas fa-comments text-[11px]"></i>
                    {text.mode}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-100 dark:border-primary-800/60">
                    <i className="fas fa-wand-magic-sparkles text-[11px]"></i>
                    {text.intent}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputValue('');
                        router.push('/unified-search');
                      }}
                      className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label={text.clear}
                    >
                      <i className="fas fa-xmark"></i>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="h-11 px-4 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-primary-500 dark:text-white enabled:hover:bg-slate-700 dark:enabled:hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-sm">{text.send}</span>
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {text.examples}
              </p>
            </form>
          </div>

          <div className="mb-10 max-w-4xl mx-auto">
            <SearchIntentPanel
              query={inputValue}
              onQuerySelect={handleIntentQuerySelect}
              maxTools={4}
              maxTutorials={4}
            />
          </div>
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-center justify-center mt-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-400">{text.loading}</span>
            </div>
          )}
          
          {/* 没有结果提示 */}
          {hasNoResults && (
            <div className="flex flex-col items-center justify-center mt-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">{text.noResultTitle}</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                {text.noResultHint}
              </p>
            </div>
          )}
          
          {/* 搜索结果 */}
          {!isLoading && totalResults > 0 && (
            <div className="space-y-12">
              {/* 工具搜索结果部分 */}
              {hasTools && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-y-3">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      {text.tools}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                        ({text.resultCount(filteredTools.length)})
                      </span>
                    </h2>
                    
                    {/* 添加排序控制 */}
                    <ToolSortControls 
                      currentSort={sortMethod}
                      onSortChange={handleSortChange}
                    />
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {sortedFilteredTools.map(tool => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 教程搜索结果部分 */}
              {hasTutorials && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {text.tutorials}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                      ({text.resultCount(filteredTutorials.length)})
                    </span>
                  </h2>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredTutorials.map(tutorial => (
                      <TutorialCard key={tutorial.id} tutorial={tutorial} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
