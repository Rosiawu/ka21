'use client';

import React, { useState, useEffect } from 'react';
import { HotCategory } from './HotCategory';
import { FeaturedToolsManager, FeaturedToolWithMeta, getPageSize } from '@/lib/featured';
import { FeaturedCategory, FeaturedConfig } from '@/types/featured';
import { Tool } from '@/lib/types';
import featuredConfig from '@/data/featured.json';
import toolsData from '@/data/tools.json';
import {useTranslations} from 'next-intl';

interface HotSectionProps {
  className?: string;
}

export function HotSection({ className = '', title, subtitle }: HotSectionProps & {title?: string; subtitle?: string}) {
  const tHot = useTranslations('Hot');
  const [categories, setCategories] = useState<Array<{
    key: string;
    category: FeaturedCategory;
    initialTools: FeaturedToolWithMeta[];
    backupPool: Tool[];
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageSize, setPageSize] = useState(3); // SSR默认值，客户端会更新
  const [manager, setManager] = useState<FeaturedToolsManager | null>(null);

  // 初始化数据
  useEffect(() => {
    const initializeData = () => {
      try {
        // 设置正确的页面大小（仅在客户端）
        const correctPageSize = getPageSize();
        setPageSize(correctPageSize);
        
        // 验证并转换配置
        const config = featuredConfig as unknown as FeaturedConfig;
        const tools = toolsData.tools as Tool[];
        
        // 创建管理器
        // 创建共享管理器实例（全局去重 + 主分类锁定在此集中处理）
        const newManager = new FeaturedToolsManager(config, tools);
        setManager(newManager);
        // 获取所有分类数据
        const categoryData = newManager.getCategoryTools();
        
        // 按配置的order排序
        const orderedCategories = config.order
          .map((categoryKey: string) => {
            const categoryInfo = categoryData.find(cd => cd.category.title === config.categories[categoryKey].title);
            if (!categoryInfo) return null;
            return {
              key: categoryKey,
              category: categoryInfo.category,
              initialTools: newManager.getInitialDisplayTools(categoryKey, pageSize),
              backupPool: categoryInfo.backupPool,
            };
          })
          .filter((v): v is { key: string; category: FeaturedCategory; initialTools: FeaturedToolWithMeta[]; backupPool: Tool[] } => Boolean(v));

        setCategories(orderedCategories);
        // 首屏回写全局显示状态（客户端水合后，用于跨分类去重）
        try {
          orderedCategories.forEach(({ key, initialTools }) => {
            newManager.updateGlobalDisplayState(key, initialTools.map(t => t.tool.id));
          });
        } catch {}
        setIsLoading(false);
      } catch (error) {
        console.error('初始化热门推荐数据失败:', error);
        setIsLoading(false);
      }
    };

    initializeData();
  }, [pageSize]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const newPageSize = getPageSize();
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
      }
    };

    // 使用防抖优化性能
    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [pageSize]);

  // 防抖函数
  function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  if (isLoading) {
    return (
      <section className={`py-8 ${className}`}>
        {/* 标题骨架屏 */}
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-64 mx-auto animate-pulse"></div>
        </div>

        {/* 分类骨架屏（自适应列数） */}
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
              </div>

              {/* 工具卡片骨架屏 */}
              <div className="space-y-3">
                {Array.from({ length: pageSize }).map((_, j) => (
                  <div key={j} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-4 border-t border-gray-100">
                <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null; // 如果没有数据，不显示板块
  }

  return (
    <section className={`py-8 ${className}`}>
      {/* 板块标题 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center">
          <span className="inline-block mr-3 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <i className="fas fa-fire text-orange-500"></i>
          </span>
          {title ?? tHot('title')}
          <span className="hidden sm:inline-block ml-3 text-sm font-normal text-slate-500 dark:text-slate-400">{subtitle ?? tHot('subtitle')}</span>
        </h2>
      </div>

      {/* 分类网格 - 自适应列数 */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {categories.map(({ key, category, initialTools, backupPool }) => (
          <HotCategory
            key={key}
            category={category}
            initialTools={initialTools}
            backupPool={backupPool}
            categoryKey={key}
            manager={manager}
          />
        ))}
      </div>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-800/50 dark:border dark:border-slate-700/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{tHot('debug.panelTitle')}</h3>
          <div className="text-xs text-gray-600 dark:text-slate-400 space-y-1">
            <div>{tHot('debug.pageSize')}: {pageSize}</div>
            <div>{tHot('debug.categoryCount')}: {categories.length}</div>
            <div>{tHot('debug.windowSize')}: {typeof window !== 'undefined' ? `${window.innerWidth}px` : 'SSR'}</div>
          </div>
        </div>
      )}
    </section>
  );
}
