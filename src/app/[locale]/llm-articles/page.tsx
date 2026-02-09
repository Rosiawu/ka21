import { Suspense } from 'react';
import LlmArticlesPage from '@/components/pages/LlmArticlesPage';

export default function LocalizedLlmArticlesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">Loading...</div>}>
      <LlmArticlesPage />
    </Suspense>
  );
}
