import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import SearchContent from '@/components/SearchContent';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { TOOL_CATEGORIES } from '@/data/toolCategories';
import type { Metadata, ResolvingMetadata } from 'next';

type SearchCategoryParams = Promise<{ locale: string; category: string }>;

export async function generateMetadata(
  { params }: { params: SearchCategoryParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, category: categoryParam } = await params;
  const isEn = locale === 'en';
  const category = TOOL_CATEGORIES.find((item) => item.id === categoryParam);
  const rawName = category?.name || categoryParam;
  const categoryName = rawName.replace(/[^\w\u4e00-\u9fa5\s-]/g, '').trim();

  const title = isEn
    ? `${categoryName || 'Category'} AI Tools - KA21 Tools`
    : `${categoryName || '分类'} AI工具 - KA21工具导航`;
  const description = isEn
    ? `Discover curated ${categoryName || 'category'} AI tools with real usage reviews and practical recommendations.`
    : `精选${categoryName || '分类'}AI工具，含真实体验和实用推荐，快速找到靠谱工具。`;

  const hreflangConfig = generateHreflangMetadata(locale, `search/${categoryParam}`);

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

export default function LocalizedSearchCategoryPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="relative overflow-hidden animate-pulse" />}>
        <SearchContent />
      </Suspense>
    </ErrorBoundary>
  );
}
