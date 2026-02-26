import { Suspense } from 'react';
import UnifiedSearchContent from '@/components/UnifiedSearchContent';

export default function UnifiedSearchPage({ params }: { params: { locale: string } }) {
  const isEn = params.locale === 'en';
  return (
    <Suspense fallback={<div className="flex justify-center py-20">{isEn ? 'Loading search results...' : '加载搜索结果中...'}</div>}>
      <UnifiedSearchContent />
    </Suspense>
  );
}
