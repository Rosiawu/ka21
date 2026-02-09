import React from 'react';
import {ToolCategoryId} from '@/lib/types';
import useCategoryMeta from '@/hooks/useCategoryMeta';
import Link from '@/i18n/Link';
import {useTranslations} from 'next-intl';

interface CategoryHeaderProps {
  categoryId: ToolCategoryId;
  count?: number;
  rightSlot?: React.ReactNode;
  viewAllHref?: string;
}

export default function CategoryHeader({ categoryId, count, rightSlot, viewAllHref }: CategoryHeaderProps) {
  const {name, description, icon} = useCategoryMeta(categoryId);
  const tCommon = useTranslations('Common');

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-800 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2 flex items-center">
        <span className="inline-block mr-3 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <i className={`fas ${icon} text-sm text-slate-600 dark:text-slate-400`}></i>
        </span>
        {name}
        {description ? (
          <span className="ml-2 text-xs text-gray-500 dark:text-neutral-400 whitespace-nowrap">{description}</span>
        ) : null}
        {typeof count === 'number' ? (
          <span className="text-sm font-normal text-gray-500 dark:text-neutral-400 ml-2">
            {tCommon('totalCount', {count})}
          </span>
        ) : null}
      </h2>
      <div className="flex items-center gap-2">
        {rightSlot}
        {viewAllHref ? (
          <Link 
            href={viewAllHref}
            className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 flex items-center whitespace-nowrap"
          >
            {tCommon('viewAll')}
            <i className="fas fa-chevron-right ml-1 text-xs"></i>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

