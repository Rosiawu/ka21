'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type DirectoryCardProfile = {
  slug: string;
  name: string;
  aliases: string[];
  headline: string;
  episodeNumber: number;
  episodeTitle: string;
  coverUrl: string;
  publishedAt: string;
  duration: string;
  industry: { code: string; label: string };
  industries: Array<{ code: string; label: string }>;
  roles: string[];
  capabilities: Array<{ code: string; label: string }>;
  deliverables: string[];
  bioSnippet: string;
  xiaoyuzhouUrl: string;
};

type FilterOption = {
  code: string;
  label: string;
  count?: number;
};

type Scenario = {
  capability: string;
  eyebrow: string;
  title: string;
  description: string;
};

type DirectoryCopy = {
  searchPlaceholder: string;
  industryLabel: string;
  capabilityLabel: string;
  deliverableLabel: string;
  allIndustries: string;
  allCapabilities: string;
  allDeliverables: string;
  results: string;
  people: string;
  clear: string;
  listen: string;
  viewProfile: string;
  emptyTitle: string;
  emptyDescription: string;
  scenarioHeading: string;
  scenarioDescription: string;
  filterHeading: string;
  latestEpisode: string;
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

const scenarioTones = [
  'bg-[#f8f1e3] xl:-rotate-1 xl:translate-y-2',
  'bg-[#dfe5ff] xl:rotate-1',
  'bg-[#f4d5cc] xl:-translate-y-1',
  'bg-[#f2d47c] xl:rotate-1 xl:translate-y-3',
  'bg-[#d9e3d5] xl:-rotate-1',
  'bg-[#f8f1e3] xl:translate-y-1',
];

const scenarioMarks = ['bg-[#e56557]', 'bg-[#2846c7]', 'bg-[#e7b44a]'];
const cardTapes = ['bg-[#e7b44a]/80', 'bg-[#f0a79e]/80', 'bg-[#91a5ef]/75'];
const imageRatios = ['aspect-[16/10]', 'aspect-[4/3]', 'aspect-[16/11]'];

export default function FdeDirectory({
  locale,
  profiles,
  industries,
  capabilities,
  deliverables,
  scenarios,
  copy,
}: {
  locale: 'zh' | 'en';
  profiles: DirectoryCardProfile[];
  industries: FilterOption[];
  capabilities: FilterOption[];
  deliverables: FilterOption[];
  scenarios: Scenario[];
  copy: DirectoryCopy;
}) {
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [capability, setCapability] = useState('');
  const [deliverable, setDeliverable] = useState('');

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = normalize(query);
    const filtered = profiles.filter((profile) => {
      const haystack = normalize([
        profile.name,
        profile.aliases.join(' '),
        profile.headline,
        profile.episodeTitle,
        profile.bioSnippet,
        profile.industries.map((item) => item.label).join(' '),
        profile.roles.join(' '),
        profile.capabilities.map((item) => item.label).join(' '),
        profile.deliverables.join(' '),
      ].join(' '));

      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (!industry || profile.industries.some((item) => item.code === industry)) &&
        (!capability || profile.capabilities.some((item) => item.code === capability)) &&
        (!deliverable || profile.deliverables.includes(deliverable))
      );
    });

    return [...filtered].sort((left, right) => right.episodeNumber - left.episodeNumber);
  }, [capability, deliverable, industry, profiles, query]);

  const hasFilters = Boolean(query || industry || capability || deliverable);

  function clearFilters() {
    setQuery('');
    setIndustry('');
    setCapability('');
    setDeliverable('');
  }

  return (
    <>
      <section className="mx-auto grid max-w-[1480px] gap-8 px-3 pb-14 pt-16 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:pt-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="font-serif text-7xl font-black leading-none text-[#e56557]">01</span>
          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-[#2846c7] dark:text-[#9cb0ff]">
            {copy.scenarioHeading}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-black leading-tight tracking-tight text-[#172238] dark:text-[#f8f1e3]">
            {copy.scenarioDescription}
          </h2>
          <div className="mt-6 flex items-center gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#e56557]" />
            <span className="h-px w-16 bg-[#172238] dark:bg-[#f8f1e3]" />
            <span className="h-3 w-3 bg-[#e7b44a]" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario, index) => {
            const selected = capability === scenario.capability;
            return (
              <button
                key={scenario.capability}
                type="button"
                onClick={() => setCapability(selected ? '' : scenario.capability)}
                aria-pressed={selected}
                className={`group relative min-h-52 border-2 border-[#172238] p-5 text-left shadow-[6px_6px_0_#172238] transition-all duration-200 hover:-translate-y-1 hover:shadow-[9px_9px_0_#172238] dark:border-[#f8f1e3] dark:shadow-[6px_6px_0_#f8f1e3] ${
                  selected
                    ? 'bg-[#2846c7] text-white xl:rotate-0 xl:translate-y-0'
                    : `${scenarioTones[index % scenarioTones.length]} text-[#172238]`
                }`}
              >
                <span className={`absolute left-1/2 top-0 h-6 w-20 -translate-x-1/2 -translate-y-1/2 rotate-2 ${scenarioMarks[index % scenarioMarks.length]}`} aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${selected ? 'text-white/75' : 'text-[#5b6270]'}`}>
                    {scenario.eyebrow}
                  </span>
                  <span className={`font-serif text-3xl font-black ${selected ? 'text-[#e7b44a]' : 'text-[#e56557]'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-7 font-serif text-2xl font-black leading-tight">{scenario.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${selected ? 'text-white/80' : 'text-[#555d6d]'}`}>{scenario.description}</p>
                <span className="absolute bottom-4 right-4 text-lg font-black" aria-hidden="true">↗</span>
              </button>
            );
          })}
        </div>
      </section>

      <section id="directory" className="mx-auto max-w-[1480px] scroll-mt-24 px-3 sm:px-6">
        <div className="border-y-2 border-[#172238] bg-[#f8f1e3] px-4 py-7 shadow-[7px_7px_0_#e7b44a] dark:border-[#f8f1e3] dark:bg-[#172238] sm:px-6">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e56557]">
                02 / Talent Directory
              </p>
              <h2 className="mt-2 font-serif text-3xl font-black text-[#172238] dark:text-[#f8f1e3] sm:text-4xl">{copy.filterHeading}</h2>
            </div>
            <p aria-live="polite" className="inline-flex items-baseline gap-2 self-start border-b-4 border-[#e56557] pb-1 text-sm font-bold text-[#172238] dark:text-[#f8f1e3] lg:self-auto">
              {copy.results} <strong className="font-serif text-4xl font-black text-[#2846c7] dark:text-[#9cb0ff]">{filteredProfiles.length}</strong> {copy.people}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(160px,0.8fr))]">
            <label className="relative block">
              <span className="sr-only">{copy.searchPlaceholder}</span>
              <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-12 w-full border-2 border-[#172238] bg-white pl-12 pr-4 text-sm text-[#172238] outline-none transition focus:bg-[#fff8dc] focus:ring-4 focus:ring-[#2846c7]/15 dark:border-[#f8f1e3] dark:bg-[#0f172a] dark:text-white"
              />
            </label>

            <label>
              <span className="sr-only">{copy.industryLabel}</span>
              <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-12 w-full border-2 border-[#172238] bg-white px-4 text-sm font-medium text-[#172238] outline-none focus:bg-[#fff8dc] dark:border-[#f8f1e3] dark:bg-[#0f172a] dark:text-white">
                <option value="">{copy.allIndustries}</option>
                {industries.map((option) => <option key={option.code} value={option.code}>{option.label} ({option.count})</option>)}
              </select>
            </label>

            <label>
              <span className="sr-only">{copy.capabilityLabel}</span>
              <select value={capability} onChange={(event) => setCapability(event.target.value)} className="h-12 w-full border-2 border-[#172238] bg-white px-4 text-sm font-medium text-[#172238] outline-none focus:bg-[#fff8dc] dark:border-[#f8f1e3] dark:bg-[#0f172a] dark:text-white">
                <option value="">{copy.allCapabilities}</option>
                {capabilities.map((option) => <option key={option.code} value={option.code}>{option.label} ({option.count})</option>)}
              </select>
            </label>

            <label>
              <span className="sr-only">{copy.deliverableLabel}</span>
              <select value={deliverable} onChange={(event) => setDeliverable(event.target.value)} className="h-12 w-full border-2 border-[#172238] bg-white px-4 text-sm font-medium text-[#172238] outline-none focus:bg-[#fff8dc] dark:border-[#f8f1e3] dark:bg-[#0f172a] dark:text-white">
                <option value="">{copy.allDeliverables}</option>
                {deliverables.map((option) => <option key={option.code} value={option.label}>{option.label} ({option.count})</option>)}
              </select>
            </label>

          </div>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {query && <span className="border border-[#172238] bg-white px-3 py-1.5 text-xs text-[#172238]">“{query}”</span>}
              {industry && <span className="border border-[#172238] bg-white px-3 py-1.5 text-xs text-[#172238]">{industries.find((item) => item.code === industry)?.label}</span>}
              {capability && <span className="border border-[#172238] bg-white px-3 py-1.5 text-xs text-[#172238]">{capabilities.find((item) => item.code === capability)?.label}</span>}
              {deliverable && <span className="border border-[#172238] bg-white px-3 py-1.5 text-xs text-[#172238]">{deliverable}</span>}
              <button type="button" onClick={clearFilters} className="px-2 py-1 text-xs font-black text-[#e56557] underline decoration-2 underline-offset-4">{copy.clear}</button>
            </div>
          )}
        </div>

        {filteredProfiles.length > 0 ? (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredProfiles.map((profile, index) => (
              <article key={profile.slug} className="group relative w-full border-2 border-[#172238] bg-[#f8f1e3] shadow-[6px_6px_0_#172238] transition duration-300 hover:-translate-y-1 hover:shadow-[9px_9px_0_#2846c7] dark:border-[#f8f1e3] dark:bg-[#172238] dark:shadow-[6px_6px_0_#f8f1e3]">
                <span className={`absolute left-1/2 top-0 z-20 h-6 w-24 -translate-x-1/2 -translate-y-1/2 ${index % 2 === 0 ? 'rotate-2' : '-rotate-2'} ${cardTapes[index % cardTapes.length]}`} aria-hidden="true" />
                <Link href={`/${locale}/fde/${profile.slug}`} className={`relative block overflow-hidden border-b-2 border-[#172238] bg-[#d9e3d5] dark:border-[#f8f1e3] ${imageRatios[index % imageRatios.length]}`} aria-label={`${copy.viewProfile}: ${profile.name}`}>
                  <Image
                    src={profile.coverUrl}
                    alt={`${profile.name} ${copy.latestEpisode}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1536px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 border-2 border-[#172238] bg-[#e7b44a] px-2.5 py-1 text-xs font-black tracking-wide text-[#172238]">EP {String(profile.episodeNumber).padStart(2, '0')}</span>
                  <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-[#172238] bg-[#f8f1e3] px-3 py-1.5 text-xs font-black text-[#172238]">{profile.industry.label}</span>
                </Link>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-3xl font-black tracking-tight text-[#172238] dark:text-[#f8f1e3]">{profile.name}</h3>
                      {profile.aliases.length > 0 && <p className="mt-1 text-xs font-bold text-[#e56557]">{profile.aliases.join(' · ')}</p>}
                    </div>
                    <span className="shrink-0 font-serif text-2xl font-black text-[#2846c7] dark:text-[#9cb0ff]">EP {String(profile.episodeNumber).padStart(2, '0')}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#747b88] dark:text-[#aeb7ca]">{formatDate(profile.publishedAt, locale)}</p>
                  <p className="mt-4 border-l-4 border-[#e7b44a] pl-3 text-sm font-bold leading-6 text-[#30394b] dark:text-[#e0e5ef]">{profile.headline}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.capabilities.slice(0, 3).map((item) => (
                      <span key={item.code} className="border-b-2 border-[#2846c7] px-1 py-1 text-xs font-bold text-[#2846c7] dark:text-[#aebcff]">{item.label}</span>
                    ))}
                  </div>

                  <p className="mt-5 line-clamp-4 text-sm leading-6 text-[#626a78] dark:text-[#b8c0cf]">{profile.bioSnippet}</p>

                  <div className="mt-6 flex items-center gap-4 border-t-2 border-[#172238] pt-4 dark:border-[#f8f1e3]">
                    <Link href={`/${locale}/fde/${profile.slug}`} className="inline-flex h-10 flex-1 items-center justify-center bg-[#2846c7] px-4 text-sm font-black text-white transition hover:bg-[#e56557]">
                      {copy.viewProfile} →
                    </Link>
                    <a href={profile.xiaoyuzhouUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center border-b-2 border-[#e56557] px-1 text-sm font-black text-[#172238] transition hover:text-[#e56557] dark:text-[#f8f1e3]">
                      ↗ {copy.listen}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 border-2 border-dashed border-[#172238] bg-[#f8f1e3] px-6 py-20 text-center shadow-[7px_7px_0_#e7b44a] dark:border-[#f8f1e3] dark:bg-[#172238]">
            <div className="mx-auto flex h-14 w-14 rotate-6 items-center justify-center border-2 border-[#172238] bg-[#e56557] text-2xl text-white dark:border-[#f8f1e3]">⌕</div>
            <h3 className="mt-6 font-serif text-2xl font-black text-[#172238] dark:text-[#f8f1e3]">{copy.emptyTitle}</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#626a78] dark:text-[#b8c0cf]">{copy.emptyDescription}</p>
            <button type="button" onClick={clearFilters} className="mt-6 border-2 border-[#172238] bg-[#2846c7] px-5 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_#172238]">{copy.clear}</button>
          </div>
        )}
      </section>
    </>
  );
}
