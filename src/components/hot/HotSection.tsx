'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import Link from '@/i18n/Link';
import featuredConfig from '@/data/featured.json';
import toolsData from '@/data/tools.json';
import weeklyPicksData from '@/data/weekly-picks.json';
import { Tool, SortMethod } from '@/lib/types';
import { getToolIconUrl, handleImageError } from '@/lib/utils';
import { localizeTool } from '@/lib/toolLocale';
import { useHotAnalytics } from '@/lib/hot-analytics';
import { sortByUpdateTime, sortByName } from '@/utils/sortTools';

interface HotSectionProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

interface WeeklyPicksConfig {
  toolIds?: string[];
  maxItems?: number;
}

export function HotSection({ className = '', title, subtitle }: HotSectionProps) {
  const tHot = useTranslations('Hot');
  const tSort = useTranslations('Sort');
  const locale = useLocale() === 'en' ? 'en' : 'zh';
  const { trackClick } = useHotAnalytics();
  const resolvedTitle = title ?? tHot('title');
  const resolvedSubtitle = subtitle ?? tHot('subtitle');
  
  // 添加排序状态
  const [sortMethod, setSortMethod] = useState<SortMethod>('recommend');

  // 获取固定的推荐工具（前6个）
  const recommendedTools = useMemo(() => {
    const allTools = (toolsData.tools as Tool[])
      .filter((tool) => tool.isVisible !== false)
      .map((tool) => localizeTool(tool, locale));

    // 按推荐级别排序，然后取前6个
    const sortedByRecommend = allTools.sort((a, b) => {
      const aWeight = a.recommendLevel === 'high' ? 3 : a.recommendLevel === 'medium' ? 2 : a.recommendLevel === 'low' ? 1 : 0;
      const bWeight = b.recommendLevel === 'high' ? 3 : b.recommendLevel === 'medium' ? 2 : b.recommendLevel === 'low' ? 1 : 0;
      return bWeight - aWeight; // 按推荐级别降序排列
    });

    return sortedByRecommend.slice(0, 6); // 固定显示6个工具
  }, [locale]);

  // 根据排序方法对固定的6个工具进行排序
  const sortedPicks = useMemo(() => {
    switch (sortMethod) {
      case 'newest':
        return sortByUpdateTime([...recommendedTools]);
      case 'name':
        return sortByName([...recommendedTools]);
      case 'recommend':
      default:
        return recommendedTools; // 推荐排序保持原顺序
    }
  }, [recommendedTools, sortMethod]);

  if (sortedPicks.length === 0) return null;

  return (
    <section className={`py-4 ${className}`}>
      <div className="mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <span className="inline-flex items-center justify-center mr-2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <i className="fas fa-fire text-orange-500 text-sm"></i>
          </span>
          {resolvedTitle}
          <span className="hidden md:inline ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            {resolvedSubtitle}
          </span>
        </h2>
      </div>

      {/* 排序控件 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">{tSort('label')}</span>
        
        <button
          onClick={() => setSortMethod('recommend')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            sortMethod === 'recommend'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <i className="fas fa-star-half-alt mr-1.5"></i>{tSort('recommend')}
        </button>
        
        <button
          onClick={() => setSortMethod('newest')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            sortMethod === 'newest'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <i className="fas fa-clock mr-1.5"></i>{tSort('newest')}
        </button>
        
        <button
          onClick={() => setSortMethod('name')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            sortMethod === 'name'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <i className="fas fa-sort-alpha-down mr-1.5"></i>{tSort('name')}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        {sortedPicks.map((tool, index) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="group min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 p-3 hover:border-primary-300 dark:hover:border-primary-500/60 hover:bg-primary-50/60 dark:hover:bg-primary-900/20 transition-colors"
            onClick={() => {
              const recommendLevel = tool.recommendLevel || 'undefined';
              trackClick('weekly_picks', resolvedTitle, tool.id, index + 1, true, recommendLevel);
            }}
            aria-label={tHot('viewToolAria', { name: tool.name, desc: tool.description })}
          >
            <div className="flex items-center gap-2.5">
              <Image
                src={getToolIconUrl(tool) || ''}
                alt={tool.name}
                width={28}
                height={28}
                className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                onError={handleImageError}
              />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-700 dark:group-hover:text-primary-300">
                {tool.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
