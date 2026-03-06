import type { Metadata, ResolvingMetadata } from 'next';
import Link from '@/i18n/Link';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { sortedDevLogs } from '@/data/devLogs';
import DevLogImageCarousel from '@/components/DevLogImageCarousel';

export async function generateMetadata(
  { params }: { params: { locale: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const isEn = locale === 'en';
  const hreflangConfig = generateHreflangMetadata(locale, 'devlog');

  return withBaseMeta(
    {
      title: isEn ? 'Development Log - KA21 Tools' : '开发日志 - KA21工具导航',
      description: isEn
        ? 'Track KA21 Tools iterations and recent product updates.'
        : '记录 KA21 工具导航的版本迭代和近期更新。',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages,
      },
    },
    parent,
  );
}

export default function DevLogPage({ params }: { params: { locale: string } }) {
  const isEn = params.locale === 'en';
  const text = {
    title: isEn ? 'Development Log' : '开发日志',
    subtitle: isEn
      ? 'The build notes are open and transparent. Every small iteration is documented.'
      : '建站过程公开透明，每一次小步迭代都记录在这里。',
    backHome: isEn ? 'Back to Home' : '返回首页',
  };

  return (
    <div className="page-shell relative py-8">
      <div className="absolute top-16 right-0 -z-10 transform translate-x-1/3">
        <div className="w-72 h-72 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute top-56 left-0 -z-10 transform -translate-x-1/3">
        <div className="w-72 h-72 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="mb-8 rounded-2xl border border-indigo-100 dark:border-purple-800/40 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/60 dark:to-purple-900/30 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-300">
                {text.title}
              </h1>
              <p className="mt-3 text-slate-700 dark:text-slate-300">{text.subtitle}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-700/70 bg-white/90 dark:bg-slate-900/70 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-slate-900 transition-colors"
            >
              <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
              {text.backHome}
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          {sortedDevLogs.map((log) => {
            const extraLinks = log.relatedLinks || [];
            const allLinks = log.relatedLink ? [log.relatedLink, ...extraLinks] : extraLinks;
            const bodyText = (isEn ? log.body.en : log.body.zh)
              .replace(/\n{2,}/g, '\n')
              .trim();
            return (
            <article
              key={log.id}
              id={log.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/95 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {log.version}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{log.date}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {isEn ? log.cardTitle.en : log.cardTitle.zh}
              </h2>

              {allLinks.length > 0 && (
                <div className="mt-3 rounded-lg border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-900/20 px-3 py-2 text-sm">
                  <div className="flex flex-col gap-2">
                    {allLinks.map((item) => {
                      const isPodcastLink = item.href.includes('xiaoyuzhoufm.com');
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group rounded-lg border border-indigo-200/80 dark:border-indigo-700/60 bg-white/90 dark:bg-slate-900/70 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                        >
                          <span className="inline-flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <i className={`${isPodcastLink ? 'fas fa-circle-play' : 'fas fa-link'} text-xs`} aria-hidden="true"></i>
                            {isEn ? item.label.en : item.label.zh}
                          </span>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {isPodcastLink
                              ? (isEn ? 'Open episode and listen now' : '点击后可直接收听')
                              : (isEn ? 'Open tutorial source' : '点击查看教程原文')}
                          </p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="mt-3 whitespace-pre-line leading-[1.5] text-slate-700 dark:text-slate-300">
                {bodyText}
              </p>

              <div className="mt-4 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-900/20 p-4">
                <div className="rounded-lg border border-purple-200/80 dark:border-purple-700/40 bg-white/80 dark:bg-slate-900/50 p-3 text-sm text-slate-600 dark:text-slate-300">
                  {log.images && log.images.length > 0 ? (
                    <DevLogImageCarousel images={log.images} isEn={isEn} />
                  ) : (
                    <div className="px-3 py-4">
                      {isEn ? log.imageSlotLabel.en : log.imageSlotLabel.zh}
                    </div>
                  )}
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
