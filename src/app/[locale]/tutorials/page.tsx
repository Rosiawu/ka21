import { Suspense } from 'react';
import TutorialsContent from '@/components/TutorialsContent';

export default function TutorialsPage({ params }: { params: { locale: string } }) {
  const isEn = params.locale === 'en';
  return (
    <Suspense fallback={<div className="flex justify-center py-20">{isEn ? 'Loading tutorials...' : '加载教程中...'}</div>}>
      <TutorialsContent />
    </Suspense>
  );
}
