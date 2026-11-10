import type { Metadata, ResolvingMetadata } from 'next';
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
    description: '从《灯下白》58 期真实深度访谈中，按行业、能力和交付方式寻找企业 AI、数据治理、AIGC、教育、出海与增长方向的实践者。',
    eyebrow: 'Dengxiabai · FDE Network',
    heroTitle: '找到真正做过事的\nAI 交付者',
    heroDescription: '58 期真实深度访谈，不只展示履历，也展示他们如何定义问题、进入业务并做出结果。告诉我你的需求，我来帮你匹配合适的 FDE 与交付组合。',
    primaryCta: '浏览人才图谱',
    contactCta: '联系吴熳',
    contactNote: '合作范围、档期与方案由主理人统一确认；页面不公开报价。',
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
    sortLabel: '排序',
    newest: '最新访谈',
    nameSort: '按姓名',
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
    description: 'Discover enterprise AI, data, AIGC, education, international growth and product practitioners through 58 in-depth Dengxiabai interviews.',
    eyebrow: 'Dengxiabai · FDE Network',
    heroTitle: 'Meet AI practitioners\nwho have shipped real work',
    heroDescription: 'Fifty-eight in-depth interviews reveal more than résumés: how practitioners frame problems, enter real operations and deliver outcomes. Share your goal and we will help assemble the right FDE team.',
    primaryCta: 'Explore the network',
    contactCta: 'Contact Wu Man',
    contactNote: 'Scope, availability and proposals are confirmed by the curator. Pricing is not published here.',
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
    sortLabel: 'Sort',
    newest: 'Latest interviews',
    nameSort: 'Name',
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
    <div className="min-h-screen bg-[#f3efe7] pb-28 text-stone-900 dark:bg-[#12100f] dark:text-stone-100 sm:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="relative overflow-hidden border-b border-stone-200/80 bg-[#efe5d5] dark:border-stone-800 dark:bg-[#1d1916]">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 75% 18%, rgba(224,107,107,.28), transparent 29%), radial-gradient(circle at 14% 86%, rgba(211,170,91,.25), transparent 30%)' }} />
        <div className="relative mx-auto grid max-w-[1480px] gap-10 px-4 py-16 sm:px-6 sm:py-24 xl:grid-cols-[1.35fr_.65fr] xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a54f4f] dark:text-[#f0a0a0]">{text.eyebrow}</p>
            <h1 className="mt-5 whitespace-pre-line text-[clamp(3rem,7.2vw,7.5rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-stone-950 dark:text-white">{text.heroTitle}</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-stone-700 dark:text-stone-300 sm:text-lg">{text.heroDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#directory" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-[#b65757] dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-[#f0a0a0]">{text.primaryCta}</a>
              <a href="tel:+8613911349663" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-stone-400/60 bg-white/50 px-6 text-sm font-semibold text-stone-900 backdrop-blur transition hover:border-[#b65757] hover:text-[#a54f4f] dark:border-stone-600 dark:bg-stone-900/40 dark:text-white">{text.contactCta} · 139 1134 9663</a>
            </div>
            <p className="mt-4 text-xs leading-5 text-stone-500 dark:text-stone-400">{text.contactNote}</p>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-stone-300/60 bg-stone-300/60 shadow-2xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-700">
            {[
              [stats.episodeCount, text.episodeStat],
              [stats.guestCount, text.guestStat],
              [stats.industryCount, text.industryStat],
              [stats.capabilityCount, text.capabilityStat],
            ].map(([value, label]) => (
              <div key={label} className="bg-white/75 p-6 backdrop-blur-xl dark:bg-stone-900/85 sm:p-8">
                <strong className="block text-4xl font-semibold tracking-tight text-stone-950 dark:text-white sm:text-5xl">{value}</strong>
                <span className="mt-2 block text-xs font-medium text-stone-500 dark:text-stone-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mx-auto max-w-[1480px] px-4 pb-5 text-xs text-stone-500 sm:px-6 dark:text-stone-400">
          {text.sourceNote} {new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', { dateStyle: 'medium' }).format(new Date(podcastDirectorySource.sourceUpdatedAt))}
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

      <section className="mx-auto mt-14 max-w-[1480px] px-3 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#a84f4f] px-6 py-10 text-white sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[44px] border-white/10" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Business Inquiries</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{locale === 'en' ? 'Tell us the outcome you need.' : '把你要的结果告诉我。'}</h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">{locale === 'en' ? 'We can match a single specialist or assemble a cross-disciplinary delivery team. Scope and availability are confirmed before any proposal.' : '可以匹配单一专家，也可以按项目组合跨行业交付团队。正式方案前会确认需求、范围与嘉宾档期。'}</p>
          </div>
          <a href="tel:+8613911349663" className="relative mt-7 inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-6 text-sm font-bold text-[#8d4141] shadow-lg transition hover:-translate-y-0.5 lg:mt-0">{text.contactCta} · 139 1134 9663</a>
        </div>
      </section>

      <a href="tel:+8613911349663" className="fixed bottom-3 left-3 right-3 z-40 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#a84f4f] px-5 text-sm font-bold text-white shadow-2xl sm:hidden">{text.contactCta} · 139 1134 9663</a>
    </div>
  );
}
