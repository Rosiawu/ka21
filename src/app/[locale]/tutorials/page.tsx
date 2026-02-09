import { Suspense } from 'react';
import TutorialsContent from '@/components/TutorialsContent';

export default function TutorialsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载教程中...</div>}>
      <TutorialsContent />
    </Suspense>
  );
}

