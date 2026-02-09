import { Suspense } from 'react';
import TutorialsContent from '@/components/TutorialsContent';
import { withBaseMeta } from '@/lib/withBaseMeta';
import type { Metadata, ResolvingMetadata } from 'next';
import { generateHreflangMetadata } from '@/lib/hreflang';

export async function generateMetadata(
  { params }: { params: { locale: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // 生成hreflang标签（教程页面路径）
  const hreflangConfig = generateHreflangMetadata(params.locale, 'tutorials');

  return withBaseMeta(
    {
      title: 'AI工具教程 - KA21工具导航',
      description: '详细的AI工具使用教程和指南，帮助您快速掌握各种AI工具的使用技巧',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages
      },
    },
    parent,
  );
}

export default function Tutorials() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-white dark:bg-neutral-900 animate-pulse">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-3 sm:px-4 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-8">
              <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto max-w-xs mb-4"></div>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto max-w-md"></div>
            </div>
            <div className="mb-8">
              <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-5 max-w-lg mx-auto"></div>
              <div className="flex gap-3 overflow-x-auto py-2 justify-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft overflow-hidden">
                  <div className="h-36 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-3">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-3"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-2 w-3/4"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <TutorialsContent />
    </Suspense>
  );
}