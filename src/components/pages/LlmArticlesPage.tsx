"use client";

import { useState, useMemo } from 'react';
import { llmArticles, LLMArticle } from '@/data/llm-articles';
import LLMArticleCard from '@/components/LLMArticleCard';
import {useTranslations} from 'next-intl';

type CategoryId = 'all' | 'intro' | 'comparison' | 'analysis';

const CATEGORY_MAP: Record<CategoryId, LLMArticle['category'] | null> = {
  all: null,
  intro: '大模型介绍',
  comparison: '模型对比',
  analysis: '技术分析'
};

export default function LlmArticlesPage() {
  const t = useTranslations('LlmArticles');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'all') return llmArticles;
    const target = CATEGORY_MAP[selectedCategory];
    return llmArticles.filter(article => article.category === target);
  }, [selectedCategory]);

  const categories: CategoryId[] = ['all', 'intro', 'comparison', 'analysis'];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        {categories.map(categoryId => (
          <button
            key={categoryId}
            onClick={() => setSelectedCategory(categoryId)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              selectedCategory === categoryId
                ? 'bg-primary-500 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t(`filters.${categoryId}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
          <LLMArticleCard key={article.id} article={article} />
        ))}
      </div>
      {filteredArticles.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          {t('empty')}
        </div>
      )}
    </div>
  );
}

