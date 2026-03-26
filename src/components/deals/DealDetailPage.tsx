/* eslint-disable @next/next/no-img-element */

import Link from '@/i18n/Link';
import type { DealViewModel } from '@/lib/deals/types';

export default function DealDetailPage({ locale, deal }: { locale: string; deal: DealViewModel }) {
  const isEn = locale === 'en';
  return (
    <div className="page-shell py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 shadow-sm dark:border-orange-900/30 dark:from-gray-950 dark:via-gray-950 dark:to-orange-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/deals" className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-300">{isEn ? 'Back to deals' : '返回羊毛区'}</Link>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-900/70 dark:text-gray-200">{deal.moderationDecision === 'approved' ? (isEn ? 'Approved' : '已通过') : (isEn ? 'Rejected' : '已拒绝')}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-50">{deal.title}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{deal.moderationReason}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {deal.priceInfo && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">{deal.priceInfo}</span>}
            {deal.expiresText && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{deal.expiresText}</span>}
            {deal.riskTags.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">{tag}</span>)}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/80">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Structured result' : '结构化结果'}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isEn ? 'Source' : '来源'}</p><p className="mt-2 break-all text-sm text-gray-700 dark:text-gray-300">{deal.sourceUrl || '-'}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isEn ? 'Confidence' : '置信度'}</p><p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{Math.round(deal.confidenceScore * 100)}%</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isEn ? 'Benefit info' : '福利信息'}</p><p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{deal.benefitInfo || '-'}</p></div>
              <div><p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isEn ? 'Invite code' : '邀请码'}</p><p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{deal.inviteCode || '-'}</p></div>
            </div>
            <div className="mt-6"><p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isEn ? 'Method' : '薅法说明'}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">{deal.methodText || deal.rawText}</p></div>
            <div className="mt-6"><p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isEn ? 'Raw text' : '原始文本'}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">{deal.rawText}</p></div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/80">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Contributor' : '投稿人'}</h2>
              <Link href={`/contributors/${deal.contributor.id}`} className="mt-4 flex items-center gap-4">
                <img src={deal.contributor.avatarUrl} alt={deal.contributor.nickname} className="h-14 w-14 rounded-full object-cover" />
                <div><p className="text-base font-semibold text-gray-900 dark:text-gray-100">{deal.contributor.nickname}</p><p className="text-sm text-gray-500 dark:text-gray-400">{isEn ? 'Helped users' : '累计帮助'} {deal.stats.helpedUsers}</p></div>
              </Link>
            </section>

            {deal.screenshots.length > 0 && <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/80"><h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{isEn ? 'Proof images' : '截图证据'}</h2><div className="mt-4 grid grid-cols-2 gap-3">{deal.screenshots.map((image, index) => <img key={index} src={image} alt={`proof-${index + 1}`} className="rounded-2xl object-cover shadow-sm" />)}</div></section>}
            {deal.sourceUrl && <a href={deal.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">{isEn ? 'Open source' : '打开来源'}</a>}
          </div>
        </section>
      </div>
    </div>
  );
}
