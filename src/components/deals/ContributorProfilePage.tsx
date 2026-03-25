/* eslint-disable @next/next/no-img-element */

import Link from '@/i18n/Link';
import type { ContributorProfileViewModel } from '@/lib/deals/types';

export default function ContributorProfilePage({ locale, profile }: { locale: string; profile: ContributorProfileViewModel }) {
  const isEn = locale === 'en';
  const stats = profile.stats;
  return (
    <div className="page-shell py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-sm dark:border-emerald-900/30 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
          <Link href="/deals" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300">{isEn ? 'Back to deals' : '返回羊毛区'}</Link>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center">
            <img src={profile.contributor.avatarUrl} alt={profile.contributor.nickname} className="h-24 w-24 rounded-full object-cover shadow-sm" />
            <div><h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{profile.contributor.nickname}</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.contributor.bio || (isEn ? 'Community contributor profile for the deals board.' : '羊毛区社区贡献者主页。')}</p></div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[[isEn ? 'Points' : '积分', stats.totalPoints],[isEn ? 'Approved' : '通过数', stats.approvedDeals],[isEn ? 'Rejected' : '拒绝数', stats.rejectedDeals],[isEn ? 'Views' : '浏览量', stats.totalDetailViews],[isEn ? 'Helped' : '帮助人数', stats.totalHelpedUsers]].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">{value}</p></div>
          ))}
        </section>

        <section className="space-y-4">
          {profile.deals.map((deal) => (
            <article key={deal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{deal.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{deal.benefitInfo || deal.methodText || deal.rawText.slice(0, 120)}</p></div>
                <Link href={`/deals/${deal.id}`} className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-200">{isEn ? 'View' : '查看'}</Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
