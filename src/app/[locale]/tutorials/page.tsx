import { Suspense } from 'react';
import TutorialsContent from '@/components/TutorialsContent';
import { withBaseMeta } from '@/lib/withBaseMeta';
import type { Metadata, ResolvingMetadata } from 'next';
import { generateHreflangMetadata } from '@/lib/hreflang';

type TutorialsLocaleParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: TutorialsLocaleParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const hreflangConfig = generateHreflangMetadata(locale, 'tutorials');

  return withBaseMeta(
    {
      title: isEn ? 'Starter Tutorials - KA21 Tools' : 'AI工具教程 - KA21工具导航',
      description: isEn
        ? 'Practical AI tool tutorials and step-by-step guides for getting started quickly.'
        : '详细的AI工具使用教程和指南，帮助您快速掌握各种AI工具的使用技巧。',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages,
      },
    },
    parent,
  );
}

export default async function TutorialsPage({ params }: { params: TutorialsLocaleParams }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return (
    <Suspense fallback={<div className="flex justify-center py-20">{isEn ? 'Loading tutorials...' : '加载教程中...'}</div>}>
      <TutorialsContent />
    </Suspense>
  );
}
