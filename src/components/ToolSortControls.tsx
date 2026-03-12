"use client"; // 客户端组件：工具排序控件，支持本地化文案

import {useTranslations} from 'next-intl';

export type SortMethod = 'recommend' | 'newest' | 'name';

interface ToolSortControlsProps {
  onSortChange: (method: SortMethod) => void;
  currentSort: SortMethod;
}

/**
 * 工具排序控制组件
 * 允许用户选择不同的排序方式：默认排序、推荐排序、最新排序、名称排序
 */
export default function ToolSortControls({ onSortChange, currentSort }: ToolSortControlsProps) {
  // 本地化：排序控件文案（使用 Sort 命名空间）
  const tSort = useTranslations('Sort');
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">{tSort('label')}</span>
      
      <button
        onClick={() => onSortChange('recommend')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          currentSort === 'recommend'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <i className="fas fa-star-half-alt mr-1.5"></i>{tSort('recommend')}
      </button>
      
      <button
        onClick={() => onSortChange('newest')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          currentSort === 'newest'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <i className="fas fa-clock mr-1.5"></i>{tSort('newest')}
      </button>
      
      <button
        onClick={() => onSortChange('name')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          currentSort === 'name'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <i className="fas fa-sort-alpha-down mr-1.5"></i>{tSort('name')}
      </button>
    </div>
  );
}
