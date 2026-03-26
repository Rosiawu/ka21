import { Suspense } from 'react';
import LlmArticlesPage from '@/components/pages/LlmArticlesPage';
import type { Metadata, ResolvingMetadata } from 'next';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';

type LlmArticlesPageParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: LlmArticlesPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const hreflangConfig = generateHreflangMetadata(locale, 'llm-articles');

  return withBaseMeta(
    {
      title: isEn ? 'LLM Articles - KA21 Tools' : '大模型文章 - KA21工具导航',
      description: isEn
        ? 'Curated articles about large language models, comparisons, and technical analysis.'
        : '精选大模型介绍、模型对比与技术分析文章。',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages,
      },
    },
    parent,
  );
}

export default function LocalizedLlmArticlesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">Loading...</div>}>
      <LlmArticlesPage />
    </Suspense>
  );
}
