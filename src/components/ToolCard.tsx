'use client';

import Image from 'next/image';
import Link from '@/i18n/Link';
import { Tool } from '@/lib/types';
import RecommendBadge from './RecommendBadge';
import { getToolIconUrl, handleImageError, shimmer, toBase64 } from '@/lib/utils';
import { trackUserAction } from '@/utils/clarity';
import React from 'react';
import {useTranslations} from 'next-intl';
import { usePathname } from 'next/navigation';
import { localizeTool } from '@/lib/toolLocale';
import DifficultyBadge from './DifficultyBadge';
import {
  getCoreScenarioColorClass,
  getCoreScenarioLabel,
  getToolHiddenTaxonomyTags,
  inferToolDifficulty,
  resolveToolCoreScenarios,
  serializeTagsForTelemetry,
} from '@/lib/coreTaxonomy';

interface ToolCardProps {
  tool: Tool;
}

function ToolCard({ tool }: ToolCardProps) {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'zh';
  const localizedTool = localizeTool(tool, locale);
  const { id, name, description, url, tags, recommendLevel, accessibility } = localizedTool;
  const tAccess = useTranslations('Access');
  const toolDifficulty = inferToolDifficulty(localizedTool);
  const coreScenarios = resolveToolCoreScenarios(localizedTool).slice(0, 2);
  
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
      core_scenarios: coreScenarios.join('|'),
      hidden_taxonomy_tags: serializeTagsForTelemetry(getToolHiddenTaxonomyTags(localizedTool), 20),
      recommend_level: recommendLevel?.toString() || 'none',
      accessibility: accessibility?.toString() || 'unknown'
    });
  };
  
  return (
    <div className="tool-card group relative bg-white dark:bg-neutral-900 rounded-xl shadow-soft dark:shadow-none overflow-hidden border border-gray-200/70 dark:border-gray-700/80 flex flex-col h-full hover:border-[#d4a853]/40 dark:hover:border-[#d4a853]/30 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(224,107,107,0.06)]">
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#d4a853]/60 to-[#e06b6b]/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      
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
              <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400">
                <i className="fas fa-cube text-lg"></i>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="text-base font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{name}</h3>
            </div>
            
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
            
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <DifficultyBadge level={toolDifficulty} size="sm" />
              {coreScenarios.map((scenarioId) => (
                <span
                  key={scenarioId}
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-white ${getCoreScenarioColorClass(scenarioId)}`}
                >
                  {getCoreScenarioLabel(scenarioId, locale)}
                </span>
              ))}
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
