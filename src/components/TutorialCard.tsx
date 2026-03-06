"use client";

import Image from 'next/image';
import { Tutorial } from '@/data/tutorials';
import { getCategoryColor, localizeTutorialCategory } from '@/utils/tutorials';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import DifficultyBadge from './DifficultyBadge';

interface TutorialCardProps {
  tutorial: Tutorial;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
  showRecommendReason?: boolean;
}

export default function TutorialCard({
  tutorial,
  showDelete = false,
  onDelete,
  showRecommendReason = false
}: TutorialCardProps) {
  const tHome = useTranslations('Home');
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'zh';
  const scenarioTag = tutorial.primaryScenario || tutorial.category;
  const localizedCategory = localizeTutorialCategory(scenarioTag, locale);
  const fallbackImageLabel = locale === 'en' ? 'Tutorial cover' : '教程图片';

  return (
    <div className="relative h-full group/card">
      {showDelete && onDelete ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.confirm(locale === 'en'
              ? `Delete "${tutorial.title}"?\n\nThis will submit code changes to GitHub and trigger redeployment.`
              : `确定要删除 "${tutorial.title}" 吗？\n\n这将提交代码变更到 GitHub 并触发重新部署。`
            )) {
              onDelete(tutorial.id);
            }
          }}
          className="absolute -top-2 -right-2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-600"
          title={locale === 'en' ? 'Delete tutorial' : '删除此教程'}
        >
          <i className="fas fa-trash text-xs"></i>
        </button>
      ) : null}

      <a
        href={tutorial.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full group active:scale-[0.985]"
      >
        <article className={`tool-card flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-white shadow-sm transition-all duration-300 group-hover:border-primary-300 group-hover:shadow-lg dark:bg-slate-800 ${showDelete ? 'ring-2 ring-red-500/20' : ''}`}>
          <div className="relative h-28 w-full overflow-hidden bg-gradient-to-r from-gray-100 to-slate-200 dark:from-gray-800 dark:to-slate-900 sm:h-36">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={tutorial.imageUrl}
                alt={tutorial.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                className="object-cover transform transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3dy53My5vcmcvMTk5OS94bGluayI+PHJlY3QgaWQ9InIiIHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjZjRmNGY1IiAvPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iMC41OzE7MC41IiBkdXI9IjJzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz48L3N2Zz4="
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"160\" viewBox=\"0 0 320 160\"><defs><linearGradient id=\"grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" style=\"stop-color:%23667eea;stop-opacity:1\" /><stop offset=\"100%\" style=\"stop-color:%23764ba2;stop-opacity:1\" /></linearGradient></defs><rect width=\"320\" height=\"160\" fill=\"url(%23grad)\" /><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"14\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"middle\">${fallbackImageLabel}</text></svg>`;
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute top-2 right-2 z-10">
              <DifficultyBadge level={tutorial.difficultyLevel} size="sm" />
            </div>
            <div className="absolute bottom-2 left-2 z-10">
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium text-white sm:px-2 sm:py-1 ${getCategoryColor(scenarioTag)}`}>
                {localizedCategory}
              </span>
            </div>
          </div>

          <div className="flex flex-grow flex-col p-2.5 sm:p-4">
            <h3 className="mb-1 line-clamp-2 text-sm font-bold transition-colors duration-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 sm:text-lg">
              {tutorial.title}
            </h3>
            <p className="mb-2 flex flex-wrap items-center gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="mr-3 flex items-center">
                <i className="fas fa-calendar-alt mr-1"></i>
                {tutorial.publishDate}
              </span>
              <span className="flex items-center">
                <i className="fas fa-user-edit mr-1"></i>
                {tutorial.author}
              </span>
            </p>

            {showRecommendReason && tutorial.recommendReason ? (
              <div className="mt-1 line-clamp-3 rounded bg-slate-100 p-1.5 text-xs italic text-slate-600 dark:bg-slate-700/30 dark:text-slate-300">
                <i className="fas fa-thumbs-up mr-1 text-primary-500"></i>
                {tutorial.recommendReason}
              </div>
            ) : null}

            <div className="mt-auto pt-1 text-sm font-medium text-primary-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-primary-400">
              {tHome('readMore')}
              <i className="fas fa-arrow-right ml-1 transition-all duration-300 group-hover:ml-2"></i>
            </div>
          </div>
        </article>
      </a>
    </div>
  );
}
