import { Suspense } from 'react';
import UnifiedSearchContent from '@/components/UnifiedSearchContent';

type UnifiedSearchPageParams = Promise<{ locale: string }>;

export default async function UnifiedSearchPage({ params }: { params: UnifiedSearchPageParams }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return (
    <Suspense fallback={<div className="flex justify-center py-20">{isEn ? 'Loading search results...' : '加载搜索结果中...'}</div>}>
      <UnifiedSearchContent />
    </Suspense>
  );
}
