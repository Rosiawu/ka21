// 本地化搜索页：渲染搜索内容（避免引用非本地化重定向页面）
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import SearchContent from '@/components/SearchContent';
import { withBaseMeta } from '@/lib/withBaseMeta';
import type { Metadata, ResolvingMetadata } from 'next';
import { generateHreflangMetadata } from '@/lib/hreflang';

type SearchPageParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: SearchPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'Search Tools and Tutorials - KA21 Tools' : '工具与教程搜索 - KA21工具导航';
  const description = isEn
    ? 'Search and discover AI tools and tutorials with multi-dimensional filters like category and function.'
    : '搜索和发现AI工具与教程，支持按类别、功能、难度等多维度筛选';
  // 生成hreflang标签（搜索页面路径）
  const hreflangConfig = generateHreflangMetadata(locale, 'search');

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
