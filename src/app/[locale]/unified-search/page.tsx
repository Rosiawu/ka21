import { Suspense } from 'react';
import UnifiedSearchContent from '@/components/UnifiedSearchContent';

export default function UnifiedSearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载搜索结果中...</div>}>
      <UnifiedSearchContent />
    </Suspense>
  );
}

