'use client';

import Image from 'next/image';
import Link from '@/i18n/Link';
import { Tool } from '@/lib/types';
import AiTagGroup from './AiTagGroup';
import RecommendBadge from './RecommendBadge';
import { getToolIconUrl, handleImageError, shimmer, toBase64 } from '@/lib/utils';
import { trackUserAction } from '@/utils/clarity';
import React from 'react';
import {useTranslations} from 'next-intl';
import { usePathname } from 'next/navigation';
import { localizeTool } from '@/lib/toolLocale';

interface ToolCardProps {
  tool: Tool;
}

function ToolCard({ tool }: ToolCardProps) {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'zh';
  const localizedTool = localizeTool(tool, locale);
  const { id, name, description, url, tags, recommendLevel, accessibility } = localizedTool;
  const tAccess = useTranslations('Access');
  
  // 使用工具函数获取图标URL
  const iconUrl = getToolIconUrl(localizedTool);
  
  // 处理工具卡片点击
  const handleToolClick = () => {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('home_scroll', String(window.scrollY));
        sessionStorage.setItem('restore_home_scroll', '1');
      }
    } catch {}
    trackUserAction('tool_click', {
      tool_id: id,
      tool_name: name,
      tool_category: tags?.[0] || 'uncategorized',
      recommend_level: recommendLevel?.toString() || 'none',
      accessibility: accessibility?.toString() || 'unknown'
    });
  };
  
  return (
    <div className="tool-card group relative bg-white dark:bg-neutral-800 rounded-xl shadow-soft dark:shadow-none overflow-hidden border border-neutral-200/70 dark:border-neutral-700/70 flex flex-col h-full hover:border-primary-300 dark:hover:border-primary-700">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      
      {/* 右上角必入标签 */}
      {recommendLevel && (
        <div className="absolute top-0 right-0 z-20">
          <RecommendBadge level={recommendLevel} size="sm" />
        </div>
      )}
      
      <Link 
        href={`/tools/${id}`}
        className="block flex-grow p-3"
        onClick={handleToolClick}
      >
        <div className="flex items-start gap-2">
          <div className="relative w-9 h-9 flex-shrink-0 md:w-10 md:h-10">
            {iconUrl ? (
              <Image
                src={iconUrl}
                alt={name}
                fill
                className="object-contain rounded-lg"
                loading="lazy"
                onError={handleImageError}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(40, 40))}`}
                sizes="(max-width: 768px) 36px, 40px"
                priority={false}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                <i className="fas fa-cube text-lg"></i>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="text-base font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{name}</h3>
            </div>
            
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {description}
            </p>
            
            <div className="mt-1.5">
              {/* 只显示AI标签组 */}
              {tags && tags.length > 0 && (
                <AiTagGroup tags={tags} maxTags={3} className="mt-1" />
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* 访问按钮区域 */}
      <div className="px-3 pb-2 mt-auto border-t border-gray-100 dark:border-neutral-800">
        <div className="flex items-center justify-between pt-2">
          {/* 左侧可访问性信息 */}
          <div className="text-xs">
            {accessibility === "直接访问" ? (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {tAccess('direct')}
              </span>
            ) : (
              <span className="text-orange-500 dark:text-orange-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {tAccess('proxy')}
              </span>
            )}
          </div>
          
          {/* 右侧访问按钮 */}
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs flex items-center text-primary-600 dark:text-primary-400 border border-primary-500 dark:border-primary-700 rounded px-2 py-0.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            onClick={(e) => e.stopPropagation()} // 防止触发卡片的点击事件
          >
            {tAccess('visit')}
            <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// 使用React.memo包装ToolCard组件以减少不必要的重渲染
export default React.memo(ToolCard); 
