import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import metrics from '@/data/seo-geo-metrics.json';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';

type PageParams = Promise<{ locale: string }>;

const statusStyles = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  submitted: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
  pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
} as const;

function valueOrWaiting(value: number | null, waiting: string) {
  return value === null ? waiting : value.toLocaleString();
}

export async function generateMetadata(
  { params }: { params: PageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const hreflang = generateHreflangMetadata(locale, 'seo-geo');
  const title = isEn ? 'SEO & GEO Visibility Dashboard - KA21' : 'SEO / GEO 效果看板 - KA21 AI牛马库';
  const description = isEn
    ? 'Track KA21 indexing, search visibility, AI citation signals and the seven-day optimization window.'
    : '查看 KA21 在 Google、Bing、百度和 AI 答案中的收录、曝光、引用与七天优化进度。';

  return withBaseMeta({
    title,
    description,
    alternates: { canonical: hreflang.canonical, languages: hreflang.languages },
  }, parent);
}

export default async function SeoGeoDashboard({ params }: { params: PageParams }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const t = isEn ? {
    eyebrow: 'KA21 VISIBILITY CONTROL ROOM',
    title: ['SEO & GEO,', 'made visible.'],
    intro: 'This dashboard separates technical readiness, platform verification, real indexing and AI-answer citations. A submission is not counted as an outcome.',
    window: '7-day observation window',
    updated: 'Last updated',
    technical: 'Technical signals',
    technicalHint: 'Everything search engines and AI crawlers need to discover the site.',
    platform: 'Platform status',
    indexed: 'Indexed',
    impressions: 'Impressions',
    clicks: 'Clicks',
    waiting: 'Collecting',
    next: 'Next',
    queries: 'Tracked queries',
    queryHint: 'Brand terms should move first; topic terms and AI citations usually need more evidence and links.',
    query: 'Query',
    type: 'Intent',
    trend: 'Daily evidence',
    event: 'Evidence / event',
    how: 'How to read this dashboard',
    steps: [
      'Green technical cards mean the site is crawlable; they do not mean it is indexed.',
      'Indexed pages and impressions are the first real SEO outcomes.',
      'A source link or explicit KA21 mention in an AI answer is counted as a GEO outcome.',
      'No change is recorded as no change. We do not manufacture progress.',
    ],
    home: 'Back to KA21',
  } : {
    eyebrow: 'KA21 VISIBILITY CONTROL ROOM',
    title: ['把 SEO 和 GEO 的效果', '摆到台面上。'],
    intro: '这个看板把技术准备、平台验证、真实收录、搜索曝光和 AI 答案引用分开统计。提交成功不等于已经有效果。',
    window: '7 天观察窗口',
    updated: '最后更新',
    technical: '技术信号',
    technicalHint: '搜索引擎与 AI 爬虫发现本站所需的基础条件。',
    platform: '平台状态',
    indexed: '已收录',
    impressions: '曝光',
    clicks: '点击',
    waiting: '采集中',
    next: '下一步',
    queries: '重点词可见性',
    queryHint: '品牌词应最先出现；主题词和 AI 引用通常需要更多内容证据与外部链接。',
    query: '查询词',
    type: '类型',
    trend: '每日证据',
    event: '当天证据 / 事件',
    how: '你应该怎么读这个看板',
    steps: [
      '技术卡片变绿，只说明爬虫可以读取，不代表已经收录。',
      '“已收录页面数”和“曝光”开始增长，才是最早的真实 SEO 效果。',
      'AI 答案里出现 KA21 名称或可点击来源链接，才计为 GEO 效果。',
      '没有变化就记录没有变化，不用虚构数字制造进展。',
    ],
    home: '返回牛马库',
  };

  const updatedAt = new Intl.DateTimeFormat(isEn ? 'en-US' : 'zh-CN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai',
  }).format(new Date(metrics.updatedAt));

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-stone-950 dark:bg-[#11100e] dark:text-stone-100">
      <section className="border-b border-stone-300/80 px-5 py-10 dark:border-stone-800 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#a84f4f]">
            <span>{t.eyebrow}</span>
            <Link href={`/${locale}`} className="rounded-full border border-stone-400 px-4 py-2 tracking-normal text-stone-700 transition hover:bg-stone-950 hover:text-white dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white dark:hover:text-stone-950">
              {t.home}
            </Link>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <h1 className="max-w-5xl text-4xl font-black leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-6xl xl:text-7xl">
                {t.title.map((line) => <span key={line} className="block sm:whitespace-nowrap">{line}</span>)}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-stone-600 dark:text-stone-300 sm:text-lg">{t.intro}</p>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-stone-300 bg-stone-300 dark:border-stone-800 dark:bg-stone-800">
              <div className="bg-white/80 p-5 dark:bg-stone-950"><p className="text-xs text-stone-500">{t.window}</p><p className="mt-2 text-lg font-bold">{metrics.windowStart}<br />→ {metrics.windowEnd}</p></div>
              <div className="bg-white/80 p-5 dark:bg-stone-950"><p className="text-xs text-stone-500">{t.updated}</p><p className="mt-2 text-lg font-bold">{updatedAt}</p></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <section>
          <h2 className="text-2xl font-black">{t.technical}</h2>
          <p className="mt-2 text-sm text-stone-500">{t.technicalHint}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(metrics.technical).map(([key, item]) => (
              <article key={key} className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-950 dark:bg-stone-950">
                <div className="flex items-center justify-between gap-3"><h3 className="font-black uppercase tracking-wider">{key}</h3><span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" /></div>
                <p className="mt-5 text-sm leading-6 text-stone-600 dark:text-stone-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">{t.platform}</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {metrics.platforms.map((platform) => (
              <article key={platform.id} className="rounded-[2rem] border border-stone-300 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-black">{platform.name}</h3>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[platform.status as keyof typeof statusStyles]}`}>{platform.status}</span>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-stone-600 dark:text-stone-300">{platform.summary}</p>
                <div className="mt-6 grid grid-cols-3 gap-2 border-y border-stone-200 py-5 text-center dark:border-stone-800">
                  <div><p className="text-xs text-stone-500">{t.indexed}</p><p className="mt-1 font-black">{valueOrWaiting(platform.indexedPages, t.waiting)}</p></div>
                  <div><p className="text-xs text-stone-500">{t.impressions}</p><p className="mt-1 font-black">{valueOrWaiting(platform.impressions, t.waiting)}</p></div>
                  <div><p className="text-xs text-stone-500">{t.clicks}</p><p className="mt-1 font-black">{valueOrWaiting(platform.clicks, t.waiting)}</p></div>
                </div>
                <p className="mt-5 text-sm"><span className="font-bold text-[#a84f4f]">{t.next}：</span>{platform.nextAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-[2rem] border border-stone-300 bg-white dark:border-stone-800 dark:bg-stone-950">
            <div className="border-b border-stone-200 p-6 dark:border-stone-800"><h2 className="text-2xl font-black">{t.queries}</h2><p className="mt-2 text-sm text-stone-500">{t.queryHint}</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-stone-100 text-xs uppercase tracking-wider text-stone-500 dark:bg-stone-900"><tr><th className="px-6 py-4">{t.query}</th><th className="px-4 py-4">{t.type}</th><th className="px-4 py-4">Google</th><th className="px-4 py-4">Bing</th><th className="px-4 py-4">Baidu</th><th className="px-4 py-4">GEO</th></tr></thead>
                <tbody>{metrics.queries.map((row) => <tr key={row.query} className="border-t border-stone-200 dark:border-stone-800"><td className="px-6 py-4 font-bold">{row.query}</td><td className="px-4 py-4 text-stone-500">{row.type}</td><td className="px-4 py-4">{row.google}</td><td className="px-4 py-4">{row.bing}</td><td className="px-4 py-4">{row.baidu}</td><td className="px-4 py-4">{row.geo}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <aside className="rounded-[2rem] bg-stone-950 p-7 text-stone-100 dark:bg-stone-100 dark:text-stone-950">
            <h2 className="text-2xl font-black">{t.how}</h2>
            <ol className="mt-6 space-y-5">{t.steps.map((step, index) => <li key={step} className="flex gap-4 text-sm leading-6"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#a84f4f] font-black text-white">{index + 1}</span><span>{step}</span></li>)}</ol>
          </aside>
        </section>

        <section>
          <h2 className="text-2xl font-black">{t.trend}</h2>
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-300 bg-white dark:border-stone-800 dark:bg-stone-950">
            {metrics.daily.map((day) => <div key={day.date} className="grid gap-3 border-t border-stone-200 p-6 first:border-0 dark:border-stone-800 md:grid-cols-[140px_repeat(4,110px)_1fr]"><strong>{day.date}</strong><span>G {valueOrWaiting(day.googleIndexed, '—')}</span><span>B {valueOrWaiting(day.bingIndexed, '—')}</span><span>百度 {valueOrWaiting(day.baiduIndexed, '—')}</span><span>GEO {valueOrWaiting(day.geoMentions, '—')}</span><span className="text-stone-600 dark:text-stone-300"><span className="mr-2 font-bold text-[#a84f4f]">{t.event}</span>{day.event}</span></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
