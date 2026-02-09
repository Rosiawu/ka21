'use client';

import React, { useState, useEffect } from 'react';
import { HotToolCard } from './HotToolCard';
import { FeaturedToolsManager, getPageSize } from '@/lib/featured';
import { useHotAnalytics, throttle } from '@/lib/hot-analytics';
import { FeaturedToolWithMeta } from '@/lib/featured';
import { FeaturedCategory } from '@/types/featured';
import { Tool } from '@/lib/types';
import {useTranslations} from 'next-intl';

interface HotCategoryProps {
  category: FeaturedCategory;
  initialTools: FeaturedToolWithMeta[];
  backupPool: Tool[];
  categoryKey: string;
  manager: FeaturedToolsManager | null;
}

export function HotCategory({
  category,
  initialTools,
  backupPool,
  categoryKey,
  manager
}: HotCategoryProps) {
  const tHot = useTranslations('Hot');
  const tHotCat = useTranslations('HotCategories');
  const [tools, setTools] = useState<FeaturedToolWithMeta[]>(initialTools);
  const [isLoading, setIsLoading] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const [pageSize, setPageSize] = useState(getPageSize());
  const { trackShuffle, trackUnderfill } = useHotAnalytics();

  // 监听窗口大小变化：页大小变化时，重新拉取并同步全局状态
  useEffect(() => {
    const handleResize = throttle(() => {
      const newPageSize = getPageSize();
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
        // 页大小改变时重新获取工具
        if (manager) {
          const { tools: newTools, state } = manager.getPaginatedTools(categoryKey, newPageSize, { excludeGlobal: true });
          setTools(newTools);
          setCanRefresh(state.totalPages > 1);
          // 回写全局当前展示
          manager.updateGlobalDisplayState(categoryKey, newTools.map(t => t.tool.id));
          // 未满页埋点
          if (newTools.length < newPageSize) {
            trackUnderfill(categoryKey, category.title, newTools.length, newPageSize, 'insufficient-assigned-pool');
          }
        }
      }
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pageSize, categoryKey, manager, category.title, trackUnderfill]);

  // 初始化时检查是否可以刷新
  useEffect(() => {
    const totalTools = initialTools.length + backupPool.length;
    setCanRefresh(totalTools > pageSize);
  }, [initialTools.length, backupPool.length, pageSize]);

  // 换一换功能：翻页 + 埋点 + 全局状态回写
  const handleRefresh = async () => {
    if (isLoading) return;
    if (!manager) return;

    setIsLoading(true);
    try {
      const { tools: newTools, state } = manager.refreshCategory(categoryKey, pageSize);
      setTools(newTools);
      
      // 发送埋点事件
      trackShuffle(
        categoryKey,
        category.title,
        state.pageIndex,
        category.featured_tools.length + backupPool.length,
        pageSize
      );

      // 检查是否还可以继续刷新
      setCanRefresh(state.totalPages > 1);
      // 未满页埋点
      if (newTools.length < pageSize) {
        trackUnderfill(categoryKey, category.title, newTools.length, pageSize, 'insufficient-assigned-pool');
      }
    } catch (error) {
      console.error('换一换失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 分类标题/副标题的本地化显示（带回退）
  const displayTitle = (() => {
    try { return tHotCat(`${categoryKey}.title`); } catch { return category.title; }
  })();
  const displaySubtitle = (() => {
    try { return tHotCat(`${categoryKey}.subtitle`); } catch { return category.subtitle; }
  })();

  return (
    <div className="min-w-0 bg-white dark:bg-slate-800/50 dark:backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700/50 p-6 hover:shadow-sm dark:hover:shadow-slate-900/20 transition-shadow">
      {/* 分类头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{category.icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{displayTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">{displaySubtitle}</p>
          </div>
        </div>
        
        {/* 换一换按钮 */}
        {canRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`
              inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors duration-200
              ${isLoading
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 active:bg-gray-300 dark:active:bg-slate-500'
              }
            `}
            aria-label={`${tHot('changeButton')} ${displayTitle}`}
          >
            <svg
              className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isLoading ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              )}
            </svg>
            {tHot('changeButton')}
          </button>
        )}
      </div>

      {/* 工具网格 */}
      <div className="grid grid-cols-1 gap-3">
        {tools.map((toolWithMeta, index) => (
          <HotToolCard
            key={`${toolWithMeta.tool.id}-${index}`}
            tool={toolWithMeta.tool}
            position={toolWithMeta.position || index + 1}
            categoryKey={categoryKey}
            categoryTitle={category.title}
            isFeatured={toolWithMeta.isFeatured}
          />
        ))}
      </div>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-50 dark:bg-slate-700/50 rounded text-xs text-gray-500 dark:text-slate-400">
          <div>{tHot('debug.category')}: {categoryKey}</div>
          <div>{tHot('debug.pageSize')}: {pageSize}</div>
          <div>{tHot('debug.current')}: {tools.length}</div>
          <div>{tHot('debug.canRefresh')}: {canRefresh ? tHot('debug.yes') : tHot('debug.no')}</div>
        </div>
      )}
    </div>
  );
}
