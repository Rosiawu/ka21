import { Suspense } from 'react';
import UnifiedSearchContent from '@/components/UnifiedSearchContent';
import type { Metadata, ResolvingMetadata } from 'next';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';

type UnifiedSearchPageParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: UnifiedSearchPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const hreflangConfig = generateHreflangMetadata(locale, 'unified-search');

  return withBaseMeta(
    {
      title: isEn ? 'Unified Search - KA21 Tools' : '统一搜索 - KA21工具导航',
      description: isEn
        ? 'Search tools and tutorials together with intent-aware recommendations.'
        : '统一搜索工具和教程，并提供意图推荐结果。',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages,
      },
    },
    parent,
  );
}

export default async function UnifiedSearchPage({ params }: { params: UnifiedSearchPageParams }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return (
    <Suspense fallback={<div className="flex justify-center py-20">{isEn ? 'Loading search results...' : '加载搜索结果中...'}</div>}>
      <UnifiedSearchContent />
    </Suspense>
  );
}
