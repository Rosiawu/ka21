"use client";

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DevLogEntry } from '@/data/devLogs';

type LogImage = NonNullable<DevLogEntry['images']>[number];

type Props = {
  images: LogImage[];
  isEn: boolean;
};

function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, index));
}

export default function DevLogImageCarousel({ images, isEn }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const getScrollStep = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 1;

    const firstCard = track.firstElementChild as HTMLElement | null;
    if (!firstCard) return 1;

    const gap = Number.parseFloat(getComputedStyle(track).gap || '0') || 0;
    return firstCard.offsetWidth + gap;
  }, []);

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = getScrollStep();
    const nextIndex = clampIndex(Math.round(track.scrollLeft / step), images.length);
    setActiveIndex(nextIndex);
  }, [getScrollStep, images.length]);

  const scrollToIndex = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const safeIndex = clampIndex(target, images.length);
    const step = getScrollStep();
    track.scrollTo({ left: safeIndex * step, behavior: 'smooth' });
    setActiveIndex(safeIndex);
  };

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  const showPrevInViewer = useCallback(() => {
    if (viewerIndex === null) return;
    setViewerIndex((prev) => {
      if (prev === null) return 0;
      return clampIndex(prev - 1, images.length);
    });
  }, [images.length, viewerIndex]);

  const showNextInViewer = useCallback(() => {
    if (viewerIndex === null) return;
    setViewerIndex((prev) => {
      if (prev === null) return 0;
      return clampIndex(prev + 1, images.length);
    });
  }, [images.length, viewerIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncActiveIndex);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', syncActiveIndex);
    syncActiveIndex();

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', syncActiveIndex);
    };
  }, [images.length, syncActiveIndex]);

  useEffect(() => {
    if (viewerIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowLeft') showPrevInViewer();
      if (event.key === 'ArrowRight') showNextInViewer();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [viewerIndex, closeViewer, showPrevInViewer, showNextInViewer]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-indigo-50/50 p-2 sm:p-3 shadow-[0_12px_30px_rgba(99,102,241,0.10)] dark:border-gray-700/70 dark:from-gray-900/80 dark:to-gray-900/60 dark:shadow-none">
        <div
          ref={trackRef}
          className="devlog-carousel flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pr-4"
        >
          {images.map((img, index) => (
            <figure
              key={img.src}
              className={`group shrink-0 snap-start transition-all duration-300 ${
                images.length === 1 ? 'w-full' : 'w-[86%] sm:w-[48%]'
              } ${
                index === activeIndex
                  ? 'opacity-100 scale-100'
                  : 'opacity-80 scale-[0.985] sm:opacity-85 sm:scale-[0.98]'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewerIndex(index)}
                className="relative w-full h-[250px] sm:h-[290px] overflow-hidden rounded-2xl border border-white/80 dark:border-gray-700/80 bg-gray-100 dark:bg-gray-800 shadow-[0_10px_24px_rgba(71,85,105,0.16)]"
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 84vw, (max-width: 1024px) 48vw, 420px"
                  className="object-cover scale-110 blur-xl opacity-30"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-white/10 dark:from-black/30 dark:to-transparent" />
                <Image
                  src={img.src}
                  alt={isEn ? img.alt.en : img.alt.zh}
                  fill
                  sizes="(max-width: 640px) 84vw, (max-width: 1024px) 48vw, 420px"
                  className="object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-gray-700 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200">
                  {index + 1}/{images.length}
                </span>
                <span className="absolute right-3 bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/85 text-gray-700 backdrop-blur transition group-hover:scale-105 dark:border-gray-700/70 dark:bg-gray-900/75 dark:text-gray-200">
                  <i className="fas fa-expand text-[11px]" aria-hidden="true"></i>
                </span>
              </button>

              {img.caption && (
                <figcaption className="mt-1 px-1 text-xs text-gray-500 dark:text-gray-400">
                  {isEn ? img.caption.en : img.caption.zh}
                </figcaption>
              )}
            </figure>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={isEn ? 'Previous image' : '上一张'}
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex <= 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-700 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 dark:border-gray-700/70 dark:bg-gray-900/85 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <i className="fas fa-chevron-left text-xs" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              aria-label={isEn ? 'Next image' : '下一张'}
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex >= images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-700 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 dark:border-gray-700/70 dark:bg-gray-900/85 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <i className="fas fa-chevron-right text-xs" aria-hidden="true"></i>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${isEn ? 'Jump to image' : '跳到第'} ${index + 1} ${isEn ? '' : '张'}`.trim()}
              onClick={() => scrollToIndex(index)}
              className={`rounded-full transition-all ${
                index === activeIndex
                  ? 'h-1.5 w-6 bg-indigo-500 dark:bg-indigo-400'
                  : 'h-1.5 w-1.5 bg-indigo-200 hover:bg-indigo-300 dark:bg-gray-600 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <div className="fixed inset-0 z-[90] bg-gray-950/82 backdrop-blur-sm p-3 sm:p-6" onClick={closeViewer}>
          <div
            className="mx-auto flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[74vh] w-full overflow-hidden rounded-2xl border border-white/20 bg-black/40">
              <Image
                src={images[viewerIndex].src}
                alt={isEn ? images[viewerIndex].alt.en : images[viewerIndex].alt.zh}
                fill
                sizes="100vw"
                className="object-contain"
              />

              <button
                type="button"
                onClick={closeViewer}
                aria-label={isEn ? 'Close viewer' : '关闭大图'}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition hover:bg-black/60"
              >
                <i className="fas fa-times text-xs" aria-hidden="true"></i>
              </button>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevInViewer}
                    disabled={viewerIndex <= 0}
                    aria-label={isEn ? 'Previous image' : '上一张'}
                    className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition hover:bg-black/60 disabled:opacity-30"
                  >
                    <i className="fas fa-chevron-left text-sm" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    onClick={showNextInViewer}
                    disabled={viewerIndex >= images.length - 1}
                    aria-label={isEn ? 'Next image' : '下一张'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white transition hover:bg-black/60 disabled:opacity-30"
                  >
                    <i className="fas fa-chevron-right text-sm" aria-hidden="true"></i>
                  </button>
                </>
              )}

              <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/30 bg-black/45 px-3 py-1 text-xs text-white">
                {viewerIndex + 1}/{images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
