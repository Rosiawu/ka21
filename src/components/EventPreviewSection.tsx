import Image from 'next/image';
import Link from '@/i18n/Link';
import { getEventPreviewSnippet, getSortedEvents } from '@/data/events';

export default async function EventPreviewSection({ isEn }: { isEn: boolean }) {
  const events = (await getSortedEvents()).slice(0, 3);
  const text = {
    badge: isEn ? 'Community Events' : '赛事区',
    title: isEn ? 'Fresh event posts from the community' : '从外部帖子里手动捞回来的新鲜赛事帖',
    subtitle: isEn
      ? 'Manually curated event opportunities and challenge announcements, ready to browse on mobile.'
      : '手动整理比赛、征集、挑战赛和活动招募，手机上也能顺手投一条。',
    viewAll: isEn ? 'Open event board' : '打开赛事区',
    submit: isEn ? 'Post from phone' : '手机发赛事帖',
    empty: isEn ? 'No event posts yet. The mobile wand is ready for the first one.' : '赛事区还没开张，但手机投稿魔法棒已经准备好了。',
    source: isEn ? 'Source post' : '原帖入口',
    online: isEn ? 'Online' : '线上/线下',
    deadline: isEn ? 'Deadline' : '截止',
  };

  return (
    <section className="mb-12">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100/90 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_rgba(236,253,245,0.98),_rgba(255,255,255,0.98))] p-5 shadow-sm dark:border-emerald-800/40 dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(135deg,_rgba(6,78,59,0.25),_rgba(15,23,42,0.94))] sm:p-6">
        <div className="relative z-10">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-slate-900/60 dark:text-emerald-300">
                {text.badge}
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">{text.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{text.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/events/submit"
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
              >
                <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
                {text.submit}
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-white dark:border-emerald-700/70 dark:bg-slate-900/70 dark:text-emerald-300 dark:hover:bg-slate-900"
              >
                {text.viewAll}
                <i className="fas fa-arrow-right text-xs" aria-hidden="true"></i>
              </Link>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/75 px-5 py-8 text-sm text-slate-600 dark:border-emerald-800/50 dark:bg-slate-900/55 dark:text-slate-300">
              {text.empty}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/92 shadow-[0_8px_24px_rgba(16,185,129,0.08)] dark:border-emerald-900/40 dark:bg-slate-900/72 dark:shadow-none"
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/20">
                    {event.coverImage ? (
                      <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-emerald-500/60">
                        <i className="fas fa-trophy" aria-hidden="true"></i>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 inline-flex rounded-full bg-white/88 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-slate-900/75 dark:text-emerald-300">
                      {event.sourceLabel || text.source}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {event.eventDate && <span>{event.eventDate}</span>}
                      {event.location && <span>{text.online} · {event.location}</span>}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{getEventPreviewSnippet(event.summary)}</p>

                    {event.tags && event.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {event.deadline ? `${text.deadline} ${event.deadline}` : event.organizer || ''}
                      </div>
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-700/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                      >
                        {text.source}
                        <i className="fas fa-arrow-up-right-from-square text-[10px]" aria-hidden="true"></i>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
