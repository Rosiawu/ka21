'use client';

import { Guide, Tool } from '@/lib/types';
import Image from 'next/image';
import AiTagGroup from '@/components/AiTagGroup';
import AccessibilityBadge from '@/components/AccessibilityBadge';
import RecommendBadge from '@/components/RecommendBadge';
import { useRouter } from '@/i18n/navigation';
import { getToolIconUrl } from '@/lib/utils';
import React from 'react';
import {useTranslations} from 'next-intl';
import { findTutorialById } from '@/data/tutorials';

// 类型定义
interface ArticleLike {
  title: string;
  url: string;
  source?: string;
  publishDate?: string;
}

function GuideSection({ guide }: { guide: Guide }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <span className={`
          w-2 h-2 rounded-full mr-2
          ${guide.type === 'text' ? 'bg-blue-500' :
            guide.type === 'video' ? 'bg-green-500' :
            'bg-yellow-500'}
        `}></span>
        {guide.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{guide.content}</p>
    </div>
  );
}

function ToolDetail({ tool }: { tool: Tool }) {
  const tTool = useTranslations('ToolDetail');
  // 使用工具函数获取图标URL
  const iconUrl = getToolIconUrl(tool);
  const router = useRouter();
  
  // 添加相关文章展开状态
  const [expandArticles, setExpandArticles] = React.useState(false);
  
  // 简化返回功能，直接返回首页
  const handleBackToHome = () => {
    // 优先使用历史返回，保留滚动位置与状态；无历史时再回到本地化首页
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  
  // 创建一个函数来获取相关教程
  const getRelatedTutorials = (): ArticleLike[] => {
    // 优先使用relatedTutorials字段
    if (tool.relatedTutorials && tool.relatedTutorials.length > 0) {
      // 尝试从tutorials.json中获取完整教程数据
      return tool.relatedTutorials.map((tutorialId: string) => {
        const tutorial = findTutorialById(tutorialId);
        if (tutorial) {
          return {
            title: tutorial.title,
            url: tutorial.url,
            source: tutorial.author,
            publishDate: tutorial.publishDate
          };
        }
        // 如果找不到对应教程，返回一个基本的未找到信息
        return {
          title: `教程 ${tutorialId}`,
          url: '#', // 占位符
          source: '未找到',
          publishDate: ''
        };
      }).filter((t: ArticleLike) => t.url !== '#'); // 过滤掉找不到的教程
    }
    
    // TODO: [后期优化] 当教程数据完全迁移后，移除此兼容层，参考TODO.md中的"移除兼容层"任务
    // 向后兼容：如果没有relatedTutorials或者查找失败，回退到使用relatedArticles
    return (tool.relatedArticles || []);
  };
  
  // 获取相关教程
  const relatedTutorials = getRelatedTutorials();
  
  return (
    <main className="relative overflow-hidden">
      {/* 添加背景装饰效果 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-8xl mx-auto">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-6"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {tTool('back')}
          </button>

          {/* 工具基本信息展示 */}
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                {iconUrl ? (
                  <Image
                    src={iconUrl}
                    alt={tool.name}
                    fill
                    className="object-contain rounded-lg"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.classList.add('icon-error');
                      target.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* 工具详情 */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{tool.name}</h1>
                  
                  <div className="flex gap-2 flex-wrap">
                    {tool.recommendLevel && (
                      <RecommendBadge level={tool.recommendLevel} size="md" variant="pill" />
                    )}
                    
                    {tool.accessibility && (
                      <AccessibilityBadge accessibility={tool.accessibility} size="md" variant="pill" />
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">{tool.description}</p>
                
                <div className="flex flex-wrap gap-3">
                  {tool.tags && tool.tags.length > 0 && (
                    <AiTagGroup tags={tool.tags} maxTags={5} size="md" />
                  )}
                  
                  <a 
                    href={tool.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    访问官网
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* 工具指南区域 */}
          {tool.guides && tool.guides.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 pb-2 border-b dark:border-slate-700">使用指南</h2>
              <div>
                {tool.guides.map((guide, index) => (
                  <GuideSection key={index} guide={guide} />
                ))}
              </div>
            </div>
          )}
          
          {/* 相关文章区域 - 支持新旧数据结构 */}
          {relatedTutorials && relatedTutorials.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700">
                <h2 className="text-xl font-bold">相关文章</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {relatedTutorials.length} 篇
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedTutorials
                  .slice(0, expandArticles ? relatedTutorials.length : 3)
                  .map((article, index) => (
                    <a
                      key={index}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 border border-gray-100 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        {article.source && (
                          <span className="flex items-center mr-3">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5M4 15h16" />
                            </svg>
                            {article.source}
                          </span>
                        )}
                        {article.publishDate && (
                          <span className="flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {article.publishDate}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
              </div>
              
              {relatedTutorials.length > 3 && (
                <button
                  onClick={() => setExpandArticles(!expandArticles)}
                  className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 border border-gray-100 dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {expandArticles ? (
                    <span className="flex items-center justify-center">
                      收起文章
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      查看全部 {relatedTutorials.length} 篇文章
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* 群友评价区域 */}
          {tool.groupComments && tool.groupComments.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 pb-2 border-b dark:border-slate-700">群友点评</h2>
              <div className="space-y-4">
                {tool.groupComments.map((comment, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{comment.content}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500 dark:text-gray-400">
                        {comment.author && <span>{comment.author}</span>}
                        {comment.author && comment.createdAt && <span> · </span>}
                        {comment.createdAt && <span>{comment.createdAt}</span>}
                      </div>
                      {comment.reviewType && (
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 rounded text-xs">
                          {comment.reviewType}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 添加图标错误处理样式 */}
      <style jsx global>{`
        .icon-error {
          background-color: #f3f4f6;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}

export default React.memo(ToolDetail); 
