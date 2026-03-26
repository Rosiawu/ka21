'use client';

import React from 'react';
import Link from '@/i18n/Link';
import Image from 'next/image';
import { Tool } from '@/lib/types';
import { useHotAnalytics } from '@/lib/hot-analytics';
import { getToolIconUrl, handleImageError } from '@/lib/utils';
import {useTranslations} from 'next-intl';
import { usePathname } from 'next/navigation';
import { localizeTool } from '@/lib/toolLocale';

interface HotToolCardProps {
  tool: Tool;
  position: number;
  categoryKey: string;
  categoryTitle: string;
  isFeatured?: boolean;
  className?: string;
}

export function HotToolCard({
  tool,
  position,
  categoryKey,
  categoryTitle,
  isFeatured = false,
  className = ''
}: HotToolCardProps) {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'zh';
  const localizedTool = localizeTool(tool, locale);
  const { trackClick } = useHotAnalytics();
  const tHot = useTranslations('Hot');

  const handleClick = () => {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('home_scroll', String(window.scrollY));
        sessionStorage.setItem('restore_home_scroll', '1');
      }
    } catch {}
    const computedFeatured = typeof isFeatured === 'boolean' ? isFeatured : tool.recommendLevel === 'high';
    const recommendLevel = localizedTool.recommendLevel || 'undefined';
    trackClick(categoryKey, categoryTitle, localizedTool.id, position, computedFeatured, recommendLevel);
  };

  return (
    <Link
      href={`/tools/${tool.id}`}
      className={`
        group relative block p-4 rounded-lg border border-gray-200 dark:border-gray-700/50
        hover:border-primary-300 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 hover:shadow-sm
        transition-all duration-200 hover:translate-x-1
        focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        ${className}
      `}
      onClick={handleClick}
      aria-label={tHot('viewToolAria', {name: localizedTool.name, desc: localizedTool.description})}
    >
      {/* 工具图标 */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Image
            src={getToolIconUrl(localizedTool) || ''}
            alt={localizedTool.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover"
            onError={handleImageError}
          />
        </div>

        {/* 工具信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
              {localizedTool.name}
            </h3>
            {localizedTool.recommendLevel === 'high' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                {tHot('featuredBadge')}
              </span>
            )}
            {/* 热门推荐页面不显示必入标签，避免同质化 */}
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300">
            {localizedTool.description}
          </p>
        </div>
      </div>

      {/* 位置指示器（仅在调试模式显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-1 text-xs text-gray-400 dark:text-gray-500">
          #{position}
        </div>
      )}
    </Link>
  );
}
