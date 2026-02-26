"use client"; // 标记为客户端组件，可以使用浏览器API和状态管理

// 引入React相关Hook和组件
import { useState, useMemo, useEffect, useCallback } from 'react'; // React核心Hook
import { Tool, ToolCategoryId } from '@/lib/types'; // 工具类型定义
import ToolCard from './ToolCard'; // 工具卡片组件
// import Link from '@/i18n/Link'; // 本地化链接包装（分组视图已改为使用 ToolCategorySection）
import SearchBar from './SearchBar'; // 搜索栏组件
import ToolCategoryFilter from './ToolCategoryFilter'; // 工具分类过滤器组件
import MobileTabFilter from './MobileTabFilter'; // 移动端标签过滤器组件
import BackToTopButton from './BackToTopButton'; // 返回顶部按钮组件
import LoadingState from './LoadingState'; // 加载状态组件
import ErrorState from './ErrorState'; // 错误状态组件
import { TOOL_CATEGORIES } from '@/data/toolCategories'; // 工具分类数据
import useDebounce from '@/hooks/useDebounce'; // 防抖Hook
import {useLocale, useTranslations} from 'next-intl';
import {filterTools} from '@/utils/filterTools';
import ToolCategorySection from '@/components/ToolCategorySection';
import useCategoryMeta from '@/hooks/useCategoryMeta';

// ========== 类型定义 ==========

// 工具列表组件属性接口
interface ToolListProps {
  tools: Tool[]; // 工具数据数组
  initialSearchQuery?: string; // 初始搜索查询，可选
  isLoading?: boolean; // 是否正在加载，可选，默认为false
  error?: Error | null; // 错误信息，可选
  selectedToolCategory?: string | null; // 选中的工具分类，可选
}

/**
 * 工具列表组件
 * - 展示工具列表，支持搜索和分类过滤
 * - 响应式设计，适配移动端和桌面端
 * - 集成防抖搜索和分类管理
 * - 支持返回顶部功能
 */
export default function ToolList({ 
  tools, // 工具数据数组
  initialSearchQuery = '', // 初始搜索查询，默认为空字符串
  isLoading = false, // 是否正在加载，默认为false
  error = null, // 错误信息，默认为null
  selectedToolCategory: initialSelectedToolCategory = null // 初始选中的工具分类，默认为null
}: ToolListProps) {
  const isEn = useLocale() === 'en';
  // 文案翻译：搜索与通用、工具列表命名空间
  const tSearch = useTranslations('Search');
  const tCommon = useTranslations('Common');
  const tList = useTranslations('ToolList');
  const tCategories = useTranslations('Categories');
  // ========== 状态管理 ==========
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery); // 搜索查询状态
  const [selectedToolCategory, setSelectedToolCategory] = useState<string | null>(initialSelectedToolCategory); // 选中的工具分类状态
  
  // 防抖处理搜索查询，延迟300毫秒，避免频繁搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const categoryIdForMeta = (selectedToolCategory || 'misc') as ToolCategoryId;
  const meta = useCategoryMeta(categoryIdForMeta);
  
  // 用户交互状态
  const [isUserInitiated, setIsUserInitiated] = useState(false); // 是否由用户主动发起操作，防止初始加载时自动应用分类
  
  // ========== 副作用处理 ==========
  
  // 当initialSearchQuery变化时，更新searchQuery
  useEffect(() => {
    setSearchQuery(initialSearchQuery); // 同步外部传入的搜索查询
  }, [initialSearchQuery]); // 依赖初始搜索查询
  
  // 当初始类别变化时，更新selectedToolCategory
  useEffect(() => {
    setSelectedToolCategory(initialSelectedToolCategory); // 同步外部传入的分类选择
  }, [initialSelectedToolCategory]); // 依赖初始分类选择
  
  // 确保页面初始加载时不自动应用保存的分类
  useEffect(() => {
    // 清除localStorage中的分类选择，确保不会自动应用
    if (!isUserInitiated) { // 如果用户还没有主动操作
      // 可选：只在首次加载时清除，或者保持注释状态仅用于开发调试
      // localStorage.removeItem('lastToolCategory'); // 清除本地存储的分类选择
    }
  }, [isUserInitiated]); // 依赖用户交互状态
  
  // ========== 事件处理函数 ==========
  
  // 使用useCallback优化处理函数，避免不必要的重新渲染
  const handleToolCategorySelect = useCallback((categoryId: string | null) => {
    // 如果已经选择了相同的分类，则不做任何操作
    if (categoryId === selectedToolCategory) { // 检查是否选择了相同分类
      return; // 提前返回，避免重复操作
    }
    
    setSelectedToolCategory(categoryId); // 更新选中的分类
    
    // 标记用户已主动选择分类
    setIsUserInitiated(true); // 设置用户已主动操作标志
  }, [selectedToolCategory]); // 依赖当前选中的分类
  
  // ========== 计算属性 ==========
  
  // 过滤工具 - 使用useMemo优化，避免每次渲染都重新计算
  const filteredTools = useMemo(() => {
    if (isLoading || error) return [];
    const validCategory = selectedToolCategory && TOOL_CATEGORIES.some(c => c.id === selectedToolCategory)
      ? (selectedToolCategory as ToolCategoryId)
      : undefined;
    return filterTools(tools, { query: debouncedSearchQuery, categoryId: validCategory });
  }, [tools, debouncedSearchQuery, selectedToolCategory, isLoading, error]);

  // 按分类对工具进行分组 - 使用useMemo优化，避免每次渲染都重新分组
  const toolsByCategory = useMemo(() => {
    if (isLoading || error) return {}; // 如果正在加载或有错误，返回空对象
    
    // 如果有搜索查询或选定的分类，继续使用filteredTools (不分组)
    if (debouncedSearchQuery || selectedToolCategory) { // 如果有搜索或选择了特定分类
      return { 
        [selectedToolCategory || 'search_results']: filteredTools // 使用搜索结果的键名或选中的分类
      };
    }
    
    // 否则按分类分组工具
    const groupedTools: Record<string, Tool[]> = {}; // 创建分类到工具数组的映射
    
    // 初始化所有分类
    TOOL_CATEGORIES.forEach(category => {
      groupedTools[category.id] = []; // 为每个分类创建空数组
    });
    
    // 将工具按分类分组
    filteredTools.forEach(tool => {
      const category = tool.toolCategory || 'misc'; // 获取工具分类，默认为'misc'
      if (!groupedTools[category]) { // 如果分类不存在
        groupedTools[category] = []; // 创建新的分类数组
      }
      groupedTools[category].push(tool); // 将工具添加到对应分类
    });
    
    return groupedTools; // 返回分组后的工具
  }, [filteredTools, debouncedSearchQuery, selectedToolCategory, isLoading, error]); // 依赖过滤后的工具、搜索查询、分类选择、加载状态和错误状态

  // ========== 条件渲染 ==========
  
  // 如果有错误，显示错误状态
  if (error) { // 如果有错误
    return (
      <ErrorState 
        message={isEn ? 'Failed to load tool list. Please try again later.' : '加载工具列表时出错，请稍后重试'} // 错误提示信息
        retryAction={() => window.location.reload()} // 重试操作：刷新页面
      />
    );
  }
  
  // 如果正在加载，显示加载状态
  if (isLoading) { // 如果正在加载
    return <LoadingState message={isEn ? 'Loading tools...' : '正在加载工具列表...'} />; // 显示加载状态组件
  }

  // ========== 渲染逻辑 ==========
  
  // 判断是否是搜索或者选择了特定分类的结果
  const isFilteredView = debouncedSearchQuery || selectedToolCategory; // 检查是否有搜索查询或选中的分类

  return (
    <div className="space-y-8 px-1 sm:px-2"> {/* 主容器，垂直间距8，水平内边距 */}
      {/* 搜索栏组件使用现有的SearchBar组件 - 保持隐藏，因为我们现在使用主页面上的搜索框 */}
      <div className="hidden"> {/* 隐藏的搜索栏容器 */}
        <SearchBar
          value={searchQuery} // 搜索查询值
          onChange={setSearchQuery} // 搜索查询变更处理函数
        />
      </div>
      
      {isFilteredView ? ( // 如果是过滤视图（有搜索或选中分类）
        // 如果是搜索或选择了特定分类的结果，则显示当前选中的分类标题
        <div className="space-y-6"> {/* 过滤视图容器 */}
          <h2 className="text-xl font-bold text-gray-800 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2 flex items-center"> {/* 分类标题 */}
            {selectedToolCategory ? ( // 如果选中了特定分类
              <>
                <span className="inline-block mr-3 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"> {/* 分类图标容器 */}
                  <i className={`fas ${meta.icon} text-sm text-slate-600 dark:text-slate-400`}></i> {/* 分类图标 */}
                </span>
                {(() => { // 立即执行函数，获取分类信息
                  const cat = TOOL_CATEGORIES.find(c => c.id === selectedToolCategory); // 查找对应的分类
                  const name = cat ? (tCategories(String(cat.id)) || cat.name) : '';
                  return (
                    <>
                      {name} {/* 分类名称（本地化） */}
                      {meta.description && ( // 如果有分类描述
                        <span className="ml-2 text-xs text-gray-500 dark:text-neutral-400 whitespace-nowrap"> {/* 描述文本样式 */}
                          {meta.description} {/* 描述（如需多语言，可扩展消息映射） */}
                        </span>
                      )}
                    </>
                  );
                })()}
              </>
            ) : ( // 否则显示搜索结果标题
              <>
                <span className="inline-block mr-3 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"> {/* 搜索图标容器 */}
                  <i className="fas fa-search text-sm text-slate-600 dark:text-slate-400"></i> {/* 搜索图标 */}
                </span>
                {tSearch('results')}: &quot;{debouncedSearchQuery}&quot; {/* 搜索查询文本 */}
              </>
            )}
            <span className="text-sm font-normal text-gray-500 dark:text-neutral-400 ml-2"> {/* 结果数量文本样式 */}
              {tCommon('totalCount', {count: filteredTools.length})} {/* 显示过滤后的工具数量 */}
            </span>
          </h2>
          
          {filteredTools.length > 0 ? ( // 如果有过滤后的工具
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"> {/* 响应式网格布局 */}
              {filteredTools.map(tool => ( // 遍历过滤后的工具
                <ToolCard key={tool.id} tool={tool} /> // 渲染工具卡片组件
              ))}
            </div>
          ) : ( // 否则显示无结果提示
            <div className="text-center py-12 text-gray-500 dark:text-neutral-400"> {/* 无结果提示容器 */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4"> {/* 图标容器 */}
                <i className="fas fa-search text-neutral-400 dark:text-neutral-500 text-2xl"></i> {/* 搜索图标 */}
              </div>
              <p className="text-lg font-medium">{tList('emptyTitle')}</p> {/* 无结果主文本 */}
              <p className="mt-2 text-sm">{tList('emptyHint')}</p> {/* 无结果提示文本 */}
            </div>
          )}
        </div>
      ) : (
        <>
          {TOOL_CATEGORIES.map(category => {
            const categoryTools = toolsByCategory[category.id] || [];
            if (categoryTools.length === 0) return null;
            return (
              <ToolCategorySection
                key={category.id}
                category={category}
                tools={categoryTools}
                showAll={true}
              />
            );
          })}
        </>
      )}
      
      {/* 移动端标签筛选组件 - 需要更新MobileTabFilter组件，移除业务分类相关逻辑 */}
      <div className="hidden"> {/* 隐藏的移动端筛选组件 */}
      <MobileTabFilter 
        selectedToolCategory={selectedToolCategory} // 当前选中的工具分类
        onToolCategorySelect={handleToolCategorySelect} // 分类选择处理函数
      />
      </div>
      
      {/* 桌面端分类面板 - 保留但隐藏，可以后续启用 */}
      <div className="hidden"> {/* 隐藏的桌面端分类面板 */}
          <ToolCategoryFilter
            categories={TOOL_CATEGORIES} // 工具分类数据
            selectedCategory={selectedToolCategory} // 当前选中的分类
            onCategorySelect={handleToolCategorySelect} // 分类选择处理函数
          />
      </div>
      
      {/* 返回顶部按钮 */}
      <BackToTopButton /> {/* 返回顶部按钮组件 */}
    </div>
  );
} 
