import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import FdeDirectory, { type DirectoryCardProfile } from '@/components/podcast/FdeDirectory';
import {
  capabilityLabels,
  deliverableLabels,
  getDirectoryStats,
  getLabel,
  guestProfiles,
  industryLabels,
  podcastDirectorySource,
  roleLabels,
  type GuestDirectoryLocale,
} from '@/lib/podcastGuests';
import { generateHreflangMetadata, getBaseUrl } from '@/lib/hreflang';
import { withBaseMeta } from '@/lib/withBaseMeta';

type PageParams = Promise<{ locale: string }>;

const copy = {
  zh: {
    title: '灯下白 FDE 人才图谱｜企业 AI 交付专家与跨行业实践者',
    description: '从《灯下白》59 期真实深度访谈中，按行业、能力和交付方式寻找企业 AI、数据治理、AIGC、教育、出海与增长方向的实践者。',
    home: '返回首页',
    eyebrow: 'Dengxiabai · FDE Network',
    heroTitle: '找到真正\n做过事的\nAI 交付者',
    heroDescription: '59 期真实深度访谈，不只展示履历，也展示他们如何定义问题、进入业务并做出结果。告诉我你的需求，我来帮你匹配合适的 FDE 与交付组合。',
    primaryCta: '浏览人才图谱',
    contactCta: '联系吴熳',
    episodeStat: '期真实访谈',
    guestStat: '位嘉宾',
    industryStat: '个行业方向',
    capabilityStat: '类核心能力',
    sourceNote: '资料来自《灯下白》公开节目与嘉宾访谈，最近同步',
    searchPlaceholder: '搜索姓名、行业、能力或业务问题',
    industryLabel: '行业',
    capabilityLabel: '能力',
    deliverableLabel: '交付方式',
    allIndustries: '全部行业',
    allCapabilities: '全部能力',
    allDeliverables: '全部交付方式',
    results: '找到',
    people: '个匹配结果',
    clear: '清除筛选',
    listen: '小宇宙',
    viewProfile: '查看能力与 Shownotes',
    emptyTitle: '暂时没有完全匹配的嘉宾',
    emptyDescription: '可以减少一个筛选条件，或直接联系吴熳描述业务问题，由主理人从完整嘉宾网络中协助组合。',
    scenarioHeading: 'Start with the problem',
    scenarioDescription: '先说你要解决什么，再匹配谁来交付',
    filterHeading: '按业务维度快速找到合适的人',
    latestEpisode: '灯下白访谈封面',
  },
  en: {
    title: 'Dengxiabai FDE Network | Enterprise AI Delivery Practitioners',
    description: 'Discover enterprise AI, data, AIGC, education, international growth and product practitioners through 59 in-depth Dengxiabai interviews.',
    home: 'Back to Home',
    eyebrow: 'Dengxiabai · FDE Network',
    heroTitle: 'Meet AI practitioners\nwho have shipped real work',
    heroDescription: 'Fifty-nine in-depth interviews reveal more than résumés: how practitioners frame problems, enter real operations and deliver outcomes. Share your goal and we will help assemble the right FDE team.',
    primaryCta: 'Explore the network',
    contactCta: 'Contact Wu Man',
    episodeStat: 'interviews',
    guestStat: 'guests',
    industryStat: 'industry areas',
    capabilityStat: 'core capabilities',
    sourceNote: 'Profiles are based on public Dengxiabai episodes and guest interviews. Last synced',
    searchPlaceholder: 'Search names, industries, capabilities or problems',
    industryLabel: 'Industry',
    capabilityLabel: 'Capability',
    deliverableLabel: 'Engagement',
    allIndustries: 'All industries',
    allCapabilities: 'All capabilities',
    allDeliverables: 'All engagement types',
    results: 'Showing',
    people: 'matches',
    clear: 'Clear filters',
    listen: 'Xiaoyuzhou',
    viewProfile: 'Profile & shownotes',
    emptyTitle: 'No exact match yet',
    emptyDescription: 'Remove one filter or contact Wu Man with your business problem. We can assemble a cross-disciplinary team from the full network.',
    scenarioHeading: 'Start with the problem',
    scenarioDescription: 'Define the outcome first, then match the right practitioners',
    filterHeading: 'Find the right person by business dimension',
    latestEpisode: 'Dengxiabai interview cover',
  },
} as const;

const scenarios = {
  zh: [
    { capability: 'enterprise-ai', eyebrow: 'Enterprise AI', title: '让 AI 真正进入业务', description: '企业诊断、流程梳理、智能体、知识库、组织协同与生产环境落地。' },
    { capability: 'training-change', eyebrow: 'Enablement', title: '培训一支会用 AI 的团队', description: '管理层认知、岗位工作坊、教师赋能与面向真实任务的能力迁移。' },
    { capability: 'aigc-content', eyebrow: 'Content & Brand', title: '用 AIGC 做内容与品牌项目', description: 'TVC、短剧、宣传片、数字 IP、演示设计与内容生产体系。' },
    { capability: 'crossborder-growth', eyebrow: 'Global Growth', title: '产品出海与跨境增长', description: '海外独立站、跨境电商、本地化、GTM 与出海内容增长。' },
    { capability: 'data-governance', eyebrow: 'Data', title: '把数据变成业务判断', description: '数据治理、业务看板、财务分析、经营洞察与自动化决策支持。' },
    { capability: 'ai-product', eyebrow: 'Build', title: '从需求到 AI 产品原型', description: '用户研究、产品定义、Vibe Coding、POC 与可验证的最小交付。' },
  ],
  en: [
    { capability: 'enterprise-ai', eyebrow: 'Enterprise AI', title: 'Bring AI into real operations', description: 'Business diagnosis, workflows, agents, knowledge bases and production deployment.' },
    { capability: 'training-change', eyebrow: 'Enablement', title: 'Build an AI-capable team', description: 'Leadership alignment, role-based workshops, educator enablement and applied learning.' },
    { capability: 'aigc-content', eyebrow: 'Content & Brand', title: 'Create content and brand systems', description: 'TVCs, short drama, campaigns, digital IP, presentations and production workflows.' },
    { capability: 'crossborder-growth', eyebrow: 'Global Growth', title: 'Grow products internationally', description: 'Independent sites, cross-border commerce, localization, GTM and global content.' },
    { capability: 'data-governance', eyebrow: 'Data', title: 'Turn data into business judgment', description: 'Data governance, dashboards, financial analysis and automated decision support.' },
    { capability: 'ai-product', eyebrow: 'Build', title: 'Move from need to AI prototype', description: 'User research, product definition, vibe coding, POCs and testable delivery.' },
  ],
} as const;

function resolveLocale(value: string): GuestDirectoryLocale {
  return value === 'en' ? 'en' : 'zh';
}

export async function generateMetadata(
  { params }: { params: PageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const text = copy[locale];
  const hreflang = generateHreflangMetadata(locale, 'fde');

  return withBaseMeta({
    title: text.title,
    description: text.description,
    keywords: locale === 'zh'
      ? ['FDE', '前线部署工程师', '企业AI落地', 'AI顾问', 'AI培训', 'AIGC交付', '灯下白播客']
      : ['FDE', 'forward deployed engineer', 'enterprise AI', 'AI consultant', 'AI delivery', 'Dengxiabai'],
    alternates: { canonical: hreflang.canonical, languages: hreflang.languages },
    openGraph: {
      type: 'website',
      title: text.title,
      description: text.description,
      url: hreflang.canonical,
      images: guestProfiles[0]?.episode.coverUrl ? [{ url: guestProfiles[0].episode.coverUrl }] : [],
    },
  }, parent);
}

export default async function FdePage({ params }: { params: PageParams }) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const text = copy[locale];
  const stats = getDirectoryStats();
  const baseUrl = getBaseUrl();

  const profiles: DirectoryCardProfile[] = guestProfiles.map((profile) => ({
    slug: profile.slug,
    name: profile.names.join(' × '),
    aliases: profile.aliases,
    headline: profile.headline[locale],
    episodeNumber: profile.episodeNumber,
    episodeTitle: profile.episode.title,
    coverUrl: profile.episode.coverUrl,
    publishedAt: profile.episode.publishedAt,
    duration: profile.episode.duration,
    industry: {
      code: profile.primaryIndustry,
      label: getLabel(industryLabels, profile.primaryIndustry, locale),
    },
    industries: profile.industries.map((code) => ({ code, label: getLabel(industryLabels, code, locale) })),
    roles: profile.roles.map((code) => getLabel(roleLabels, code, locale)),
    capabilities: profile.capabilities.map((code) => ({ code, label: getLabel(capabilityLabels, code, locale) })),
    deliverables: profile.deliverables.map((code) => getLabel(deliverableLabels, code, locale)),
    bioSnippet: profile.episode.guestBio.slice(0, 250),
    xiaoyuzhouUrl: profile.episode.xiaoyuzhouUrl,
  }));

  const industryOptions = Object.keys(industryLabels)
    .map((code) => ({
      code,
      label: getLabel(industryLabels, code, locale),
      count: guestProfiles.filter((profile) => profile.industries.includes(code)).length,
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const capabilityOptions = Object.keys(capabilityLabels)
    .map((code) => ({
      code,
      label: getLabel(capabilityLabels, code, locale),
      count: guestProfiles.filter((profile) => profile.capabilities.includes(code)).length,
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const deliverableOptions = Object.keys(deliverableLabels)
    .map((code) => ({
      code,
      label: getLabel(deliverableLabels, code, locale),
      count: guestProfiles.filter((profile) => profile.deliverables.includes(code)).length,
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/${locale}/fde#page`,
        name: text.title,
        description: text.description,
        url: `${baseUrl}/${locale}/fde`,
        inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: guestProfiles.length,
          itemListElement: guestProfiles.map((profile, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${baseUrl}/${locale}/fde/${profile.slug}`,
            name: profile.names.join(' & '),
          })),
        },
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${baseUrl}/${locale}/fde#service`,
        name: locale === 'en' ? 'Dengxiabai FDE Matching' : '灯下白 FDE 能力匹配',
        description: text.description,
        url: `${baseUrl}/${locale}/fde`,
        telephone: '+86-139-1134-9663',
        areaServed: 'CN',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+86-139-1134-9663',
          contactType: 'business inquiries',
          availableLanguage: ['zh-CN', 'en'],
        },
      },
    ],
  };

  return (
    <div
      className="min-h-screen bg-[#f4efe3] pb-28 text-[#172238] dark:bg-[#111827] dark:text-[#f8f1e3] sm:pb-16"
      style={{
        backgroundImage: 'linear-gradient(rgba(40,70,199,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(40,70,199,.045) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="relative overflow-hidden border-b-2 border-[#172238] bg-[#f8f1e3] dark:border-[#f8f1e3] dark:bg-[#172238]">
        <div className="pointer-events-none absolute -left-16 top-24 h-36 w-36 rotate-12 bg-[#e56557] opacity-90" />
        <div className="pointer-events-none absolute right-[7%] top-10 h-24 w-24 rounded-full border-[18px] border-[#2846c7]/20" />
        <div className="relative mx-auto max-w-[1480px] px-4 pt-5 sm:px-6 sm:pt-7">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#172238]/25 bg-white/75 px-5 text-sm font-bold text-[#172238] shadow-[0_10px_30px_rgba(23,34,56,.10)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#172238]/45 dark:border-white/25 dark:bg-white/10 dark:text-white">
            <span aria-hidden="true">←</span>
            {text.home}
          </Link>
        </div>
        <div className="relative mx-auto grid max-w-[1480px] gap-14 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(520px,.85fr)] xl:items-center xl:gap-20">
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-[#e56557]" />
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#2846c7] dark:text-[#9cb0ff]">{text.eyebrow}</p>
            </div>
            <h1 className="mt-7 max-w-5xl whitespace-pre-line font-serif text-[clamp(3.3rem,6.4vw,6.6rem)] font-black leading-[.92] tracking-[-0.065em] text-[#172238] dark:text-[#f8f1e3]">
              {text.heroTitle}
            </h1>
            <div className="mt-7 max-w-3xl border-l-[5px] border-[#e56557] pl-5">
              <p className="text-base leading-8 text-[#3d4657] dark:text-[#d9deea] sm:text-lg">{text.heroDescription}</p>
            </div>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a href="#directory" className="inline-flex min-h-12 items-center justify-center border-2 border-[#172238] bg-[#2846c7] px-6 text-sm font-bold text-white shadow-[5px_5px_0_#172238] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#172238] dark:border-[#f8f1e3] dark:shadow-[5px_5px_0_#f8f1e3]">{text.primaryCta} ↓</a>
              <a href="tel:+8613911349663" className="inline-flex min-h-12 items-center justify-center border-2 border-[#172238] bg-[#f8f1e3] px-6 text-sm font-bold text-[#172238] transition hover:bg-[#e7b44a] dark:border-[#f8f1e3]">{text.contactCta} · 139 1134 9663</a>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-[650px] gap-8 sm:grid-cols-[230px_minmax(0,1fr)] sm:items-center">
            <div className="relative mx-auto w-full max-w-[230px]">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 border-2 border-[#172238] bg-[#e56557] dark:border-[#f8f1e3]" />
              <div className="relative -rotate-2 border-2 border-[#172238] bg-[#f8f1e3] p-2 shadow-[8px_9px_0_#2846c7] dark:border-[#f8f1e3]">
                <div className="absolute left-1/2 top-0 z-10 h-6 w-20 -translate-x-1/2 -translate-y-1/2 rotate-2 bg-[#e7b44a]/85" aria-hidden="true" />
                <Image
                  src="/images/podcast/dengxiabai-logo-maomao.png"
                  alt="灯下白 Logo"
                  width={1254}
                  height={1254}
                  priority
                  className="aspect-square h-auto w-full object-cover"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                [stats.episodeCount, text.episodeStat, 'bg-[#f8f1e3] -rotate-2'],
                [stats.guestCount, text.guestStat, 'bg-[#e7b44a] rotate-2'],
                [stats.industryCount, text.industryStat, 'bg-[#e56557] -rotate-1 text-white'],
                [stats.capabilityCount, text.capabilityStat, 'bg-[#2846c7] rotate-1 text-white'],
              ].map(([value, label, color]) => (
                <div key={label} className={`min-h-32 border-2 border-[#172238] p-4 shadow-[5px_5px_0_#172238] sm:p-5 ${color}`}>
                  <strong className="block font-serif text-5xl font-black leading-none tracking-[-0.05em] sm:text-6xl">{value}</strong>
                  <span className="mt-3 block text-xs font-black leading-4 sm:text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative border-t-2 border-[#172238] bg-[#e7b44a] dark:border-[#f8f1e3]">
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#172238] sm:px-6">
            <span>{text.sourceNote} {new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', { dateStyle: 'medium' }).format(new Date(podcastDirectorySource.sourceUpdatedAt))}</span>
            <span>Public interviews · Curated profiles · Real delivery</span>
          </div>
        </div>
      </section>

      <FdeDirectory
        locale={locale}
        profiles={profiles}
        industries={industryOptions}
        capabilities={capabilityOptions}
        deliverables={deliverableOptions}
        scenarios={[...scenarios[locale]]}
        copy={text}
      />

      <section className="mx-auto mt-20 max-w-[1480px] px-3 sm:px-6">
        <div className="relative overflow-hidden border-2 border-[#172238] bg-[#2846c7] px-6 py-10 text-white shadow-[9px_9px_0_#e56557] dark:border-[#f8f1e3] sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between">
          <div className="absolute -right-6 -top-16 h-52 w-52 rounded-full border-[34px] border-[#e7b44a]" />
          <div className="absolute bottom-0 right-1/3 h-20 w-20 rotate-12 bg-[#e56557]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e7b44a]">Business Inquiries / 03</p>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight sm:text-5xl">{locale === 'en' ? 'Tell us the outcome you need.' : '把你要的结果告诉我。'}</h2>
            <p className="mt-5 text-sm leading-7 text-white/85 sm:text-base">{locale === 'en' ? 'Match with one specialist or assemble a cross-disciplinary team around the outcome you want to achieve.' : '可以匹配单一专家，也可以围绕你要实现的结果，组合跨行业交付团队。'}</p>
          </div>
          <a href="tel:+8613911349663" className="relative mt-8 inline-flex min-h-12 shrink-0 items-center justify-center border-2 border-[#172238] bg-[#f8f1e3] px-6 text-sm font-black text-[#172238] shadow-[5px_5px_0_#172238] transition hover:-translate-y-0.5 lg:mt-0">{text.contactCta} · 139 1134 9663</a>
        </div>
      </section>

      <a href="tel:+8613911349663" className="fixed bottom-3 left-3 right-3 z-40 inline-flex min-h-12 items-center justify-center border-2 border-[#172238] bg-[#e56557] px-5 text-sm font-black text-white shadow-[5px_5px_0_#172238] sm:hidden">{text.contactCta} · 139 1134 9663</a>
    </div>
  );
}
