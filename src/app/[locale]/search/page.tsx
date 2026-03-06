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
  const title = isEn ? 'AI Tool Search - KA21 Tools' : 'AI工具搜索 - KA21工具导航';
  const description = isEn
    ? 'Search and discover AI tools with multi-dimensional filters like category and function.'
    : '搜索和发现最适合您的AI工具，支持按类别、功能、难度等多维度筛选';
  // 生成hreflang标签（搜索页面路径）
  const hreflangConfig = generateHreflangMetadata(params.locale, 'search');

  return withBaseMeta(
    {
      title,
      description,
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages
      },
      openGraph: {
        title,
        description,
        type: 'website',
        url: hreflangConfig.canonical,
        images: ['/KA21.png'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/KA21.png'],
      }
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
