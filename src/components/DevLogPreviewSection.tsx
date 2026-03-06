"use client";

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from '@/i18n/Link';
import { sortedDevLogs, getPreviewSnippet } from '@/data/devLogs';

export default function DevLogPreviewSection({ isEn }: { isEn: boolean }) {
  const logs = sortedDevLogs;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const text = {
    badge: isEn ? 'In Progress' : '持续更新',
    title: isEn ? 'Development Log' : '开发日志',
    subtitle: isEn
      ? 'Small weekly iterations, clearly documented.'
      : '牛马库建站零零散散小碎片，记录这个网友共创的小破站踉踉跄跄向前走。',
    viewAll: isEn ? 'View full log' : '查看完整日志',
    updateTag: isEn ? 'Latest' : '最新',
    openLog: isEn ? 'Open full log' : '看完整图文',
    withImages: isEn ? 'images' : '图',
    prev: isEn ? 'Previous' : '上一条',
    next: isEn ? 'Next' : '下一条',
  };

  const getStep = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 1;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return 1;
    const gap = Number.parseFloat(getComputedStyle(track).gap || '0') || 0;
    return first.offsetWidth + gap;
  }, []);

  const syncIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    const next = Math.max(0, Math.min(logs.length - 1, Math.round(track.scrollLeft / step)));
    setActiveIndex(next);
  }, [getStep, logs.length]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const safe = Math.max(0, Math.min(logs.length - 1, index));
      const step = getStep();
      track.scrollTo({ left: safe * step, behavior: 'smooth' });
      setActiveIndex(safe);
    },
    [getStep, logs.length],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncIndex);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', syncIndex);
    syncIndex();

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', syncIndex);
    };
  }, [syncIndex]);

  return (
    <section className="mb-12">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100/90 bg-gradient-to-r from-indigo-50/95 to-purple-50/90 p-5 shadow-sm dark:border-purple-800/40 dark:from-slate-800/60 dark:to-purple-900/30 sm:p-6">
          <div className="pointer-events-none absolute -top-12 right-8 h-36 w-36 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/10" />
          <div className="pointer-events-none absolute -bottom-16 left-4 h-36 w-36 rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-500/10" />

          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs text-indigo-700 dark:border-purple-700/60 dark:bg-slate-900/60 dark:text-indigo-300">
                  {text.badge}
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">{text.title}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text.subtitle}</p>
              </div>
              <Link
                href="/devlog"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-white dark:border-indigo-700/70 dark:bg-slate-900/70 dark:text-indigo-300 dark:hover:bg-slate-900"
              >
                {text.viewAll}
                <i className="fas fa-arrow-right text-xs" aria-hidden="true"></i>
              </Link>
            </div>

            <div className="relative">
              {logs.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={text.prev}
                    onClick={() => scrollToIndex(activeIndex - 1)}
                    disabled={activeIndex <= 0}
                    className="absolute left-2 top-[28%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-35 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 md:inline-flex"
                  >
                    <i className="fas fa-chevron-left text-xs" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    aria-label={text.next}
                    onClick={() => scrollToIndex(activeIndex + 1)}
                    disabled={activeIndex >= logs.length - 1}
                    className="absolute right-2 top-[28%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-35 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 md:inline-flex"
                  >
                    <i className="fas fa-chevron-right text-xs" aria-hidden="true"></i>
                  </button>
                </>
              )}

              <div
                ref={trackRef}
                className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 pr-4"
              >
                {logs.map((log) => (
                  <Link
                    key={log.id}
                    href={`/devlog#${log.id}`}
                    className="group w-[86%] shrink-0 snap-start rounded-xl border border-indigo-100 bg-white/92 p-3 shadow-[0_6px_18px_rgba(99,102,241,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 dark:border-purple-800/40 dark:bg-slate-900/70 dark:shadow-none dark:hover:border-indigo-600 sm:w-[62%] lg:w-[32%]"
                  >
                    <div className="relative h-28 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {log.images?.[0] ? (
                        <Image
                          src={log.images[0].src}
                          alt={isEn ? log.images[0].alt.en : log.images[0].alt.zh}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-700 dark:to-slate-800" />
                      )}
                      <span className="absolute left-2 top-2 rounded-full border border-white/60 bg-white/85 px-2 py-0.5 text-[10px] text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200">
                        {log.version}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{log.date}</span>
                        <span>
                          {log.images?.length || 0} {text.withImages}
                        </span>
                      </div>

                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                        {isEn ? log.cardTitle.en : log.cardTitle.zh}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {getPreviewSnippet(isEn ? log.body.en : log.body.zh)}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-indigo-600 dark:text-indigo-300">{text.updateTag}</span>
                        <span className="text-slate-500 transition-colors group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-300">
                          {text.openLog}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {logs.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {logs.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`${isEn ? 'Jump to log' : '跳到第'} ${index + 1} ${isEn ? '' : '条'}`.trim()}
                    onClick={() => scrollToIndex(index)}
                    className={`rounded-full transition-all ${
                      index === activeIndex
                        ? 'h-1.5 w-6 bg-indigo-500 dark:bg-indigo-400'
                        : 'h-1.5 w-1.5 bg-indigo-200 hover:bg-indigo-300 dark:bg-slate-600 dark:hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
