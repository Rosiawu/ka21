import { Suspense } from 'react';
import TutorialsContent from '@/components/TutorialsContent';

type TutorialsLocaleParams = Promise<{ locale: string }>;

export default async function TutorialsPage({ params }: { params: TutorialsLocaleParams }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return (
    <Suspense fallback={<div className="flex justify-center py-20">{isEn ? 'Loading tutorials...' : '加载教程中...'}</div>}>
      <TutorialsContent />
    </Suspense>
  );
}
