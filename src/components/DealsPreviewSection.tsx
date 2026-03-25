import Link from '@/i18n/Link';
import type { DealViewModel } from '@/lib/deals/types';

interface DealsPreviewSectionProps {
  isEn: boolean;
  deals: DealViewModel[];
}

export default function DealsPreviewSection({ isEn, deals }: DealsPreviewSectionProps) {
  if (deals.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <span className="inline-flex mr-3 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
              <i className="fas fa-tags text-orange-500"></i>
            </span>
            {isEn ? 'Benefit Zone' : '羊毛区'}
          </h2>
          <Link
            href="/deals/submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <i className="fas fa-bolt text-xs" aria-hidden="true"></i>
            {isEn ? 'Submit first deal' : '投稿第一条羊毛'}
          </Link>
        </div>
        <div className="rounded-2xl border border-dashed border-orange-200 dark:border-orange-900/40 bg-white/80 dark:bg-slate-900/60 px-6 py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEn
              ? 'No deals yet — be the first to share a deal with the community!'
              : '还没有羊毛信息，快来投稿第一条！'}
          </p>
        </div>
      </section>
    );
  }

  const visibleDeals = deals.slice(0, 4);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center">
          <span className="inline-flex mr-3 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
            <i className="fas fa-tags text-orange-500"></i>
          </span>
          {isEn ? 'Benefit Zone' : '羊毛区'}
          <span className="ml-3 text-sm font-normal text-slate-500 dark:text-slate-400">
            {isEn ? 'Community-submitted deals' : '社区投稿的优惠信息'}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/deals/submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
          >
            <i className="fas fa-bolt text-[10px]" aria-hidden="true"></i>
            {isEn ? 'Submit' : '投稿'}
          </Link>
          <Link
            href="/deals"
            className="text-orange-600 dark:text-orange-400 text-sm font-medium hover:text-orange-700 dark:hover:text-orange-300 hidden sm:flex items-center"
          >
            {isEn ? 'View all' : '查看全部'}
            <i className="fas fa-arrow-right ml-1 text-xs"></i>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {visibleDeals.map((deal) => (
          <Link
            key={deal.id}
            href={`/deals/${deal.id}`}
            className="group block rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/75 p-4 shadow-sm transition-all hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>{deal.sourceName || (isEn ? 'Unknown' : '未知来源')}</span>
              {deal.expiresText && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                  {deal.expiresText}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              {deal.title}
            </h3>
            {deal.benefitInfo && (
              <p className="mt-1.5 text-xs leading-4 text-slate-500 dark:text-slate-400 line-clamp-2">
                {deal.benefitInfo}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {deal.priceInfo && (
                <span className="rounded-full bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:text-orange-300">
                  {deal.priceInfo}
                </span>
              )}
              {deal.inviteCode && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {isEn ? 'Code' : '码'}: {deal.inviteCode}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deal.contributor.avatarUrl}
                alt={deal.contributor.nickname}
                className="h-5 w-5 rounded-full object-cover"
              />
              <span>{deal.contributor.nickname}</span>
              {deal.stats.helpedUsers > 0 && (
                <span className="ml-auto">
                  {isEn ? 'Helped' : '帮助了'} {deal.stats.helpedUsers}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 text-center sm:hidden">
        <Link
          href="/deals"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {isEn ? 'View all deals' : '查看全部羊毛'}
          <i className="fas fa-chevron-right ml-2"></i>
        </Link>
      </div>
    </section>
  );
}
