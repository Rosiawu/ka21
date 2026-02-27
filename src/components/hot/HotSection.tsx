'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import Link from '@/i18n/Link';
import featuredConfig from '@/data/featured.json';
import toolsData from '@/data/tools.json';
import weeklyPicksData from '@/data/weekly-picks.json';
import { Tool } from '@/lib/types';
import { getToolIconUrl, handleImageError } from '@/lib/utils';
import { localizeTool } from '@/lib/toolLocale';
import { useHotAnalytics } from '@/lib/hot-analytics';

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
  const locale = useLocale() === 'en' ? 'en' : 'zh';
  const { trackClick } = useHotAnalytics();
  const resolvedTitle = title ?? tHot('title');
  const resolvedSubtitle = subtitle ?? tHot('subtitle');

  const picks = useMemo(() => {
    const config = weeklyPicksData as WeeklyPicksConfig;
    const toolMap = new Map(
      (toolsData.tools as Tool[])
        .filter((tool) => tool.isVisible !== false)
        .map((tool) => [tool.id, tool])
    );

    const fallbackToolIds = (featuredConfig.order || []).flatMap((categoryKey) => {
      const key = categoryKey as keyof typeof featuredConfig.categories;
      return featuredConfig.categories[key]?.featured_tools || [];
    });
    const sourceIds = config.toolIds && config.toolIds.length > 0 ? config.toolIds : fallbackToolIds;
    const maxItems = Math.min(Math.max(config.maxItems || 6, 1), 8);

    return sourceIds
      .map((id) => toolMap.get(id))
      .filter((tool): tool is Tool => Boolean(tool))
      .slice(0, maxItems)
      .map((tool) => localizeTool(tool, locale));
  }, [locale]);

  if (picks.length === 0) return null;

  return (
    <section className={`py-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <span className="inline-flex items-center justify-center mr-2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <i className="fas fa-fire text-orange-500 text-sm"></i>
          </span>
          {resolvedTitle}
          <span className="hidden md:inline ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            {resolvedSubtitle}
          </span>
        </h2>
        <Link
          href="/tools"
          className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          {tHot('viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        {picks.map((tool, index) => (
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
