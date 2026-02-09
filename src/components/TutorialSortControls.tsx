"use client"; // 客户端组件：教程排序控件，本地化文案

import { TutorialSortMethod } from '@/data/tutorials';
import {useTranslations} from 'next-intl';

interface TutorialSortControlsProps {
  onSortChange: (method: TutorialSortMethod) => void;
  currentSort: TutorialSortMethod;
}

/**
 * 教程排序控制组件
 * 允许用户选择不同的排序方式：时间排序和难度排序
 */
export default function TutorialSortControls({ onSortChange, currentSort }: TutorialSortControlsProps) {
  const t = useTranslations('TutorialSort');
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">{t('label')}</span>
      
      <button
        onClick={() => onSortChange('latest')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          currentSort === 'latest'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <i className="fas fa-clock mr-1.5"></i>{t('latestFirst')}
      </button>
      
      <button
        onClick={() => onSortChange('oldest')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          currentSort === 'oldest'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <i className="fas fa-history mr-1.5"></i>{t('oldestFirst')}
      </button>
      
      <button
        onClick={() => onSortChange('difficulty-asc')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          currentSort === 'difficulty-asc'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <i className="fas fa-sort-amount-down-alt mr-1.5"></i>{t('easyToHard')}
      </button>
    </div>
  );
}
