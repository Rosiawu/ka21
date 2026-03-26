import Link from '@/i18n/Link';
import type { DealViewModel } from '@/lib/deals/types';

export default function DealsHubPage({ locale, deals }: { locale: string; deals: DealViewModel[] }) {
  const isEn = locale === 'en';
  return (
    <div className="page-shell py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 shadow-sm dark:border-orange-900/30 dark:from-gray-950 dark:via-gray-950 dark:to-orange-950/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600 dark:text-orange-300">{isEn ? 'Benefit Zone' : '羊毛区'}</p>
              <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'A feed for price drops, credits, invites, and useful promos' : '收集价格变动、额度赠送、邀请码和真有用优惠信息'}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{isEn ? 'This snapshot keeps the core intent in code: community-submitted deals, auto extraction, points, and contributor profiles.' : '这版代码把核心意图直接落在仓库里：社区投稿、自动抽取、积分，以及贡献者主页。'}</p>
            </div>
            <Link href="/deals/submit" className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"><i className="fas fa-bolt text-xs" aria-hidden="true"></i><span>{isEn ? 'Submit a deal' : '投稿羊毛'}</span></Link>
          </div>
        </section>

        {deals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-orange-200 bg-white/90 px-6 py-12 text-center text-sm text-gray-600 dark:border-orange-900/40 dark:bg-gray-950/70 dark:text-gray-300">{isEn ? 'No approved deals yet. Use the submit page to seed the board.' : '还没有自动通过的羊毛。先去投稿页放第一条。'}</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {deals.map((deal) => (
              <article key={deal.id} className="rounded-[1.75rem] border border-gray-200/80 bg-white/95 p-5 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/75">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400"><span>{new Date(deal.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}</span><span>{deal.sourceName || (isEn ? 'Unknown source' : '未知来源')}</span></div>
                <h2 className="mt-3 text-xl font-semibold leading-8 text-gray-900 dark:text-gray-100">{deal.title}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{deal.benefitInfo || deal.methodText || deal.rawText.slice(0, 120)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {deal.priceInfo && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">{deal.priceInfo}</span>}
                  {deal.inviteCode && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">{isEn ? 'Invite:' : '邀请码:'} {deal.inviteCode}</span>}
                  {deal.expiresText && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{deal.expiresText}</span>}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link href={`/contributors/${deal.contributor.id}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={deal.contributor.avatarUrl} alt={deal.contributor.nickname} className="h-10 w-10 rounded-full object-cover" />
                    <div><p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{deal.contributor.nickname}</p><p className="text-xs text-gray-500 dark:text-gray-400">{isEn ? 'Helped' : '累计帮助'} {deal.stats.helpedUsers}</p></div>
                  </Link>
                  <Link href={`/deals/${deal.id}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:text-gray-200">{isEn ? 'View detail' : '查看详情'}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
