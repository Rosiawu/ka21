import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  capabilityLabels,
  clientTypeLabels,
  deliverableLabels,
  getGuestProfile,
  getLabel,
  guestProfiles,
  industryLabels,
  roleLabels,
  type GuestDirectoryLocale,
  type ShowNoteBlock,
} from '@/lib/podcastGuests';
import { generateHreflangMetadata, getBaseUrl } from '@/lib/hreflang';
import { withBaseMeta } from '@/lib/withBaseMeta';

type PageParams = Promise<{ locale: string; slug: string }>;

const copy = {
  zh: {
    home: '返回首页',
    back: '返回 FDE 人才图谱',
    episode: '《灯下白》访谈',
    profile: '嘉宾介绍',
    capabilities: '核心能力',
    deliverables: '可匹配的交付方向',
    industries: '行业经验',
    roles: '角色背景',
    clients: '适配客户类型',
    shownotes: '完整 Shownotes',
    shownotesHint: '以下内容来自节目公开 Shownotes，保留嘉宾经历、访谈主题、金句和时间轴。',
    listen: '前往小宇宙收听',
    contact: '联系吴熳匹配合作',
    contactTitle: '想邀请这位嘉宾参与交付？',
    contactBody: '告诉我你的业务目标、对象和时间，我会结合访谈中验证过的经验，协助匹配合适的嘉宾与交付方式。',
    published: '发布于',
    duration: '时长',
    related: '同方向的其他实践者',
    play: '在线播放',
    originalLanguage: '',
  },
  en: {
    home: 'Back to Home',
    back: 'Back to the FDE network',
    episode: 'Dengxiabai Interview',
    profile: 'Guest Profile',
    capabilities: 'Core Capabilities',
    deliverables: 'Potential Engagements',
    industries: 'Industry Experience',
    roles: 'Professional Roles',
    clients: 'Relevant Client Types',
    shownotes: 'Full Shownotes',
    shownotesHint: 'The following public Chinese-language shownotes preserve the guest background, topics, quotes and timeline.',
    listen: 'Listen on Xiaoyuzhou',
    contact: 'Contact Wu Man',
    contactTitle: 'Interested in working with this guest?',
    contactBody: 'Share your desired outcome, audience and timing. We will match relevant, interview-verified experience with the right engagement format.',
    published: 'Published',
    duration: 'Duration',
    related: 'More practitioners in this field',
    play: 'Play episode',
    originalLanguage: 'Original content is in Chinese.',
  },
} as const;

function resolveLocale(value: string): GuestDirectoryLocale {
  return value === 'en' ? 'en' : 'zh';
}

function formatDate(value: string, locale: GuestDirectoryLocale) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function toIsoDuration(value: string) {
  const parts = value.split(':').map(Number);
  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0] || 0, parts[1] || 0];
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds || (!hours && !minutes) ? `${seconds}S` : ''}`;
}

function noteBlockClass(block: ShowNoteBlock) {
  if (block.type === 'heading') {
    return 'mt-9 text-xl font-semibold leading-8 text-stone-950 first:mt-0 dark:text-stone-50';
  }
  if (block.type === 'timestamp') {
    return 'rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300';
  }
  return 'text-[15px] leading-8 text-stone-700 dark:text-stone-300';
}

export function generateStaticParams() {
  return guestProfiles.flatMap((profile) => [
    { locale: 'zh', slug: profile.slug },
    { locale: 'en', slug: profile.slug },
  ]);
}

export async function generateMetadata(
  { params }: { params: PageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const profile = getGuestProfile(slug);
  if (!profile) return {};

  const name = profile.names.join(' × ');
  const title = locale === 'en'
    ? `${name} | ${profile.headline.en} | Dengxiabai FDE Network`
    : `${name}｜${profile.headline.zh}｜灯下白 FDE 人才图谱`;
  const description = `${profile.headline[locale]}。${profile.episode.guestBio}`.slice(0, 155);
  const hreflang = generateHreflangMetadata(locale, `fde/${profile.slug}`);

  return withBaseMeta({
    title,
    description,
    keywords: [
      ...profile.names,
      ...profile.aliases,
      ...profile.capabilities.map((code) => getLabel(capabilityLabels, code, locale)),
      ...profile.industries.map((code) => getLabel(industryLabels, code, locale)),
      'FDE',
      '灯下白',
    ],
    alternates: { canonical: hreflang.canonical, languages: hreflang.languages },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: hreflang.canonical,
      images: profile.episode.coverUrl ? [{ url: profile.episode.coverUrl, alt: profile.episode.title }] : [],
    },
  }, parent);
}

export default async function GuestDetailPage({ params }: { params: PageParams }) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const text = copy[locale];
  const profile = getGuestProfile(slug);
  if (!profile) notFound();

  const baseUrl = getBaseUrl();
  const name = profile.names.join(' × ');
  const related = guestProfiles
    .filter((candidate) => candidate.slug !== profile.slug && candidate.industries.includes(profile.primaryIndustry))
    .slice(0, 3);

  const people = profile.names.map((personName, index) => ({
    '@type': 'Person',
    '@id': `${baseUrl}/${locale}/fde/${profile.slug}#person-${index + 1}`,
    name: personName,
    alternateName: index === 0 && profile.aliases.length ? profile.aliases : undefined,
    jobTitle: profile.headline[locale],
    knowsAbout: [
      ...profile.capabilities.map((code) => getLabel(capabilityLabels, code, locale)),
      ...profile.industries.map((code) => getLabel(industryLabels, code, locale)),
    ],
    subjectOf: { '@id': `${baseUrl}/${locale}/fde/${profile.slug}#episode` },
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${baseUrl}/${locale}/fde/${profile.slug}#page`,
        name: `${name}｜${profile.headline[locale]}`,
        description: profile.episode.guestBio,
        url: `${baseUrl}/${locale}/fde/${profile.slug}`,
        dateModified: profile.episode.publishedAt,
        inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
        mainEntity: people.map((person) => ({ '@id': person['@id'] })),
      },
      ...people,
      {
        '@type': 'PodcastEpisode',
        '@id': `${baseUrl}/${locale}/fde/${profile.slug}#episode`,
        name: profile.episode.title,
        episodeNumber: profile.episodeNumber,
        datePublished: profile.episode.publishedAt,
        timeRequired: toIsoDuration(profile.episode.duration),
        url: profile.episode.xiaoyuzhouUrl,
        image: profile.episode.coverUrl,
        description: profile.episode.guestBio,
        partOfSeries: {
          '@type': 'PodcastSeries',
          name: '灯下白-走进 AI 圈的真实对话',
          url: 'https://www.xiaoyuzhoufm.com/podcast/69a44f5aa19c08db64bbd8a7',
        },
      },
      {
        '@type': 'ProfessionalService',
        name: locale === 'en' ? 'Dengxiabai FDE Matching' : '灯下白 FDE 能力匹配',
        url: `${baseUrl}/${locale}/fde`,
        telephone: '+86-139-1134-9663',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f3efe7] pb-24 text-stone-900 dark:bg-[#12100f] dark:text-stone-100 sm:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="border-b border-stone-200 bg-[#efe5d5] dark:border-stone-800 dark:bg-[#1d1916]">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
          <Link href={`/${locale}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-4 text-sm font-semibold text-stone-700 transition hover:border-[#a84f4f] hover:text-[#a84f4f] dark:border-stone-700 dark:bg-white/10 dark:text-stone-200">
            <span aria-hidden="true">←</span> {text.home}
          </Link>
          <Link href={`/${locale}/fde`} className="inline-flex min-h-10 items-center gap-2 px-2 text-sm font-semibold text-stone-600 transition hover:text-[#a84f4f] dark:text-stone-300">
            <span aria-hidden="true">↙</span> {text.back}
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-stone-200 bg-[#efe5d5] dark:border-stone-800 dark:bg-[#1d1916]">
          <div className="mx-auto grid max-w-[1380px] gap-8 px-4 pb-14 pt-4 sm:px-6 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a84f4f] dark:text-[#f0a0a0]">
                <span>{text.episode}</span>
                <span aria-hidden="true">·</span>
                <span>EP {String(profile.episodeNumber).padStart(2, '0')}</span>
              </div>
              <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-stone-950 dark:text-white sm:text-6xl xl:text-7xl">{name}</h1>
              {profile.aliases.length > 0 && <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">{profile.aliases.join(' · ')}</p>}
              <p className="mt-6 max-w-3xl text-xl font-medium leading-9 text-stone-800 dark:text-stone-200 sm:text-2xl">{profile.headline[locale]}</p>
              {text.originalLanguage && <p className="mt-3 text-xs text-stone-500">{text.originalLanguage}</p>}

              <div className="mt-7 flex flex-wrap gap-2">
                {profile.industries.map((code) => (
                  <span key={code} className="rounded-full border border-stone-300 bg-white/55 px-3 py-1.5 text-xs font-medium text-stone-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-200">{getLabel(industryLabels, code, locale)}</span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={profile.episode.xiaoyuzhouUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-[#a84f4f] dark:bg-stone-100 dark:text-stone-950">{text.listen}</a>
                <a href="tel:+8613911349663" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-stone-400 px-6 text-sm font-semibold text-stone-900 transition hover:border-[#a84f4f] hover:text-[#a84f4f] dark:border-stone-600 dark:text-white">{text.contact} · 139 1134 9663</a>
              </div>
            </div>

            <a href={profile.episode.xiaoyuzhouUrl} target="_blank" rel="noopener noreferrer" className="order-1 group relative block aspect-square overflow-hidden rounded-[2rem] bg-stone-200 shadow-[0_35px_90px_rgba(71,45,30,0.2)] lg:order-2" aria-label={text.listen}>
              <Image src={profile.episode.coverUrl} alt={profile.episode.title} fill priority unoptimized sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/55 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md">{profile.episode.title}</span>
            </a>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84f4f] dark:text-[#f0a0a0]">{text.profile}</p>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-stone-700 dark:text-stone-300 sm:text-lg">{profile.episode.guestBio}</p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-stone-100 pt-5 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
                <span>{text.published}：{formatDate(profile.episode.publishedAt, locale)}</span>
                <span>{text.duration}：{profile.episode.duration}</span>
              </div>
            </section>

            {profile.episode.audioUrl && (
              <section className="rounded-[2rem] border border-stone-200 bg-[#2a2521] p-6 text-white shadow-sm dark:border-stone-700 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">{text.play}</p>
                <h2 className="mt-3 text-xl font-semibold leading-8">{profile.episode.title}</h2>
                <audio className="mt-6 w-full" controls preload="none" src={profile.episode.audioUrl}>
                  <a href={profile.episode.xiaoyuzhouUrl}>{text.listen}</a>
                </audio>
              </section>
            )}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
              <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">{text.shownotes}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{text.shownotesHint}</p>
              <div className="mt-8 space-y-4">
                {profile.episode.showNotes.map((block, index) => (
                  <p key={`${block.type}-${index}`} className={noteBlockClass(block)}>{block.text}</p>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-sm font-semibold text-stone-950 dark:text-white">{text.capabilities}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.capabilities.map((code) => <span key={code} className="rounded-full bg-[#fff0ed] px-3 py-1.5 text-xs font-medium text-[#994747] dark:bg-[#422526] dark:text-[#ffc5bd]">{getLabel(capabilityLabels, code, locale)}</span>)}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-sm font-semibold text-stone-950 dark:text-white">{text.deliverables}</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
                {profile.deliverables.map((code) => <li key={code} className="flex gap-2"><span className="text-[#a84f4f]">✓</span><span>{getLabel(deliverableLabels, code, locale)}</span></li>)}
              </ul>
            </section>

            <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-sm font-semibold text-stone-950 dark:text-white">{text.roles}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">{profile.roles.map((code) => getLabel(roleLabels, code, locale)).join(' · ')}</p>
              <h2 className="mt-5 border-t border-stone-100 pt-5 text-sm font-semibold text-stone-950 dark:border-stone-800 dark:text-white">{text.clients}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">{profile.clientTypes.map((code) => getLabel(clientTypeLabels, code, locale)).join(' · ')}</p>
            </section>

            <section className="rounded-[1.75rem] bg-[#a84f4f] p-5 text-white shadow-lg">
              <h2 className="text-xl font-semibold">{text.contactTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-white/80">{text.contactBody}</p>
              <a href="tel:+8613911349663" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#8f4040]">139 1134 9663</a>
            </section>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mx-auto max-w-[1380px] px-4 pb-14 sm:px-6">
            <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">{text.related}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((candidate) => (
                <Link key={candidate.slug} href={`/${locale}/fde/${candidate.slug}`} className="group flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#d98989] hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    <Image src={candidate.episode.coverUrl} alt={candidate.names.join(' × ')} fill unoptimized sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-stone-950 group-hover:text-[#a84f4f] dark:text-white">{candidate.names.join(' × ')}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-stone-400">{candidate.headline[locale]}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <a href="tel:+8613911349663" className="fixed bottom-3 left-3 right-3 z-40 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#a84f4f] px-5 text-sm font-bold text-white shadow-2xl sm:hidden">{text.contact} · 139 1134 9663</a>
    </div>
  );
}
