import type { DevLogEntry } from '@/data/devLogs';

type LogImage = NonNullable<DevLogEntry['images']>[number];

type Props = {
  images: LogImage[];
  isEn: boolean;
};

function getGridClass(total: number): string {
  if (total <= 1) return 'grid-cols-1';
  if (total === 2) return 'grid-cols-1 md:grid-cols-2';
  return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
}

export default function DevLogImageCarousel({ images, isEn }: Props) {
  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${getGridClass(images.length)}`}>
        {images.map((img, index) => (
          <a
            key={img.src}
            href={img.src}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-indigo-50/50 p-2 shadow-[0_12px_30px_rgba(99,102,241,0.10)] transition-transform hover:-translate-y-0.5 dark:border-gray-700/70 dark:from-gray-900/80 dark:to-gray-900/60 dark:shadow-none"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/80 bg-gray-100 dark:border-gray-700/80 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={isEn ? img.alt.en : img.alt.zh}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-gray-700 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200">
                {index + 1}/{images.length}
              </span>
              <span className="absolute right-3 bottom-3 rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-gray-700 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/75 dark:text-gray-200">
                {isEn ? 'Open image' : '查看原图'}
              </span>
            </div>

            {img.caption && (
              <p className="px-1 pt-2 text-xs text-gray-500 dark:text-gray-400">
                {isEn ? img.caption.en : img.caption.zh}
              </p>
            )}
          </a>
        ))}
      </div>

      {images.length > 1 && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          {isEn ? 'Click any image to open the full-size version.' : '点任意图片可打开原图。'}
        </p>
      )}
    </div>
  );
}
