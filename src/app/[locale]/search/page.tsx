// 本地化搜索页：渲染搜索内容（避免引用非本地化重定向页面）
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import SearchContent from '@/components/SearchContent';
import { withBaseMeta } from '@/lib/withBaseMeta';
import type { Metadata, ResolvingMetadata } from 'next';
import { generateHreflangMetadata } from '@/lib/hreflang';

export async function generateMetadata(
  { params }: { params: { locale: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const isEn = params.locale === 'en';
  // 生成hreflang标签（搜索页面路径）
  const hreflangConfig = generateHreflangMetadata(params.locale, 'search');

  return withBaseMeta(
    {
      title: isEn ? 'AI Tool Search - KA21 Tools' : 'AI工具搜索 - KA21工具导航',
      description: isEn
        ? 'Search and discover AI tools with multi-dimensional filters like category and function.'
        : '搜索和发现最适合您的AI工具，支持按类别、功能、难度等多维度筛选',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages
      },
    },
    parent,
  );
}

export default function LocalizedSearchPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="relative overflow-hidden animate-pulse" />}>
        <SearchContent />
      </Suspense>
    </ErrorBoundary>
  );
}
