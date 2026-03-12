import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from '@/i18n/Link';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { sortedEvents } from '@/data/events';

export async function generateMetadata(
  { params }: { params: { locale: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const isEn = locale === 'en';
  const hreflangConfig = generateHreflangMetadata(locale, 'events');

  return withBaseMeta(
    {
      title: isEn ? 'Event Board - KA21 Tools' : '赛事区 - KA21工具导航',
      description: isEn
        ? 'A mobile-friendly board for manually curated community event posts and competition opportunities.'
        : '一个适合手机查看与投稿的赛事区，收录手动整理的比赛、活动和招募帖子。',
      alternates: {
        canonical: hreflangConfig.canonical,
        languages: hreflangConfig.languages,
      },
    },
    parent,
  );
}

export default function EventsPage({ params }: { params: { locale: string } }) {
  const isEn = params.locale === 'en';
  const text = {
    title: isEn ? 'Event Board' : '赛事区',
    subtitle: isEn
      ? 'Manually collected event threads, challenges, and calls for participation from around the web.'
      : '手动整理从外面看到的比赛帖、活动帖、挑战赛和征集帖，做成一个能随手翻、随手投的赛事区。',
    submit: isEn ? 'Post from phone' : '手机发赛事帖',
    backHome: isEn ? 'Back to Home' : '返回首页',
    empty: isEn ? 'No posts yet. Use the wand to publish the first one.' : '还没有赛事帖，先用魔法棒发第一条吧。',
    source: isEn ? 'Open source post' : '查看原帖',
    eventDate: isEn ? 'Event date' : '赛事时间',
    deadline: isEn ? 'Deadline' : '截止时间',
    location: isEn ? 'Location' : '地点/形式',
    organizer: isEn ? 'Organizer' : '主办方',
    posterCount: isEn ? 'posters' : '张配图',
  };

  return (
    <div className="page-shell relative py-8">
      <div className="absolute top-16 right-0 -z-10 translate-x-1/3">
        <div className="h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5"></div>
      </div>
      <div className="absolute top-56 left-0 -z-10 -translate-x-1/3">
        <div className="h-72 w-72 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/5"></div>
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm dark:border-emerald-800/40 dark:from-slate-800/60 dark:to-emerald-900/20 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-300">
                {text.title}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-700 dark:text-slate-300">{text.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/events/submit"
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
              >
                <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
                <span>{text.submit}</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-white dark:border-emerald-700/70 dark:bg-slate-900/70 dark:text-emerald-300 dark:hover:bg-slate-900"
              >
                <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i>
                {text.backHome}
              </Link>
            </div>
          </div>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/90 px-6 py-12 text-center text-sm text-slate-600 dark:border-emerald-800/50 dark:bg-slate-900/65 dark:text-slate-300">
            {text.empty}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedEvents.map((event) => (
              <article
                key={event.id}
                id={event.id}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/75"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/20">
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl text-emerald-500/60">
                      <i className="fas fa-trophy" aria-hidden="true"></i>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4">
                    <div className="flex flex-wrap gap-2">
                      {(event.tags || []).slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{new Date(event.createdAt).toISOString().slice(0, 10)}</span>
                    {event.sourceLabel && <span>{event.sourceLabel}</span>}
                    {event.images && event.images.length > 0 && <span>{event.images.length} {text.posterCount}</span>}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold leading-7 text-slate-900 dark:text-slate-100">{event.title}</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{event.summary}</p>
                  </div>

                  <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950/60">
                    {event.eventDate && (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{text.eventDate}</span>
                        <span className="text-right text-slate-800 dark:text-slate-100">{event.eventDate}</span>
                      </div>
                    )}
                    {event.deadline && (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{text.deadline}</span>
                        <span className="text-right text-slate-800 dark:text-slate-100">{event.deadline}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{text.location}</span>
                        <span className="text-right text-slate-800 dark:text-slate-100">{event.location}</span>
                      </div>
                    )}
                    {event.organizer && (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{text.organizer}</span>
                        <span className="text-right text-slate-800 dark:text-slate-100">{event.organizer}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{event.author ? `${isEn ? 'Posted by' : '投稿人'} ${event.author}` : ''}</div>
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                      {text.source}
                      <i className="fas fa-arrow-up-right-from-square text-[11px]" aria-hidden="true"></i>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
