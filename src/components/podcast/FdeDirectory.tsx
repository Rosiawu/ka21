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
  sortLabel: string;
  newest: string;
  nameSort: string;
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
  const [sort, setSort] = useState<'newest' | 'name'>('newest');

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

    return [...filtered].sort((left, right) => {
      if (sort === 'name') return left.name.localeCompare(right.name, locale === 'en' ? 'en' : 'zh-CN');
      return right.episodeNumber - left.episodeNumber;
    });
  }, [capability, deliverable, industry, locale, profiles, query, sort]);

  const hasFilters = Boolean(query || industry || capability || deliverable);

  function clearFilters() {
    setQuery('');
    setIndustry('');
    setCapability('');
    setDeliverable('');
  }

  return (
    <>
      <section className="mx-auto max-w-[1480px] px-3 pb-8 pt-4 sm:px-6 sm:pt-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b65757] dark:text-[#f0a0a0]">
              {copy.scenarioHeading}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
              {copy.scenarioDescription}
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario, index) => {
            const selected = capability === scenario.capability;
            return (
              <button
                key={scenario.capability}
                type="button"
                onClick={() => setCapability(selected ? '' : scenario.capability)}
                aria-pressed={selected}
                className={`group min-h-44 rounded-[1.6rem] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  selected
                    ? 'border-[#e06b6b] bg-[#fff0ed] shadow-md dark:bg-[#442526]'
                    : 'border-stone-200/80 bg-white/85 dark:border-stone-700 dark:bg-stone-900/75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                    {scenario.eyebrow}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-500 transition-colors group-hover:bg-[#e06b6b] group-hover:text-white dark:bg-stone-800">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-semibold text-stone-900 dark:text-stone-50">{scenario.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{scenario.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section id="directory" className="mx-auto max-w-[1480px] scroll-mt-24 px-3 sm:px-6">
        <div className="rounded-[2rem] border border-stone-200/80 bg-[#f8f5ef]/90 p-4 shadow-[0_24px_80px_rgba(82,54,38,0.08)] dark:border-stone-700 dark:bg-stone-900/80 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b65757] dark:text-[#f0a0a0]">
                Talent Directory
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-50 sm:text-3xl">{copy.filterHeading}</h2>
            </div>
            <p aria-live="polite" className="text-sm text-stone-500 dark:text-stone-400">
              {copy.results} <strong className="text-stone-900 dark:text-white">{filteredProfiles.length}</strong> {copy.people}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(150px,0.8fr))_minmax(120px,0.6fr)]">
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
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-sm text-stone-900 outline-none transition focus:border-[#e06b6b] focus:ring-4 focus:ring-[#e06b6b]/10 dark:border-stone-700 dark:bg-stone-950 dark:text-white"
              />
            </label>

            <label>
              <span className="sr-only">{copy.industryLabel}</span>
              <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-800 outline-none focus:border-[#e06b6b] dark:border-stone-700 dark:bg-stone-950 dark:text-white">
                <option value="">{copy.allIndustries}</option>
                {industries.map((option) => <option key={option.code} value={option.code}>{option.label} ({option.count})</option>)}
              </select>
            </label>

            <label>
              <span className="sr-only">{copy.capabilityLabel}</span>
              <select value={capability} onChange={(event) => setCapability(event.target.value)} className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-800 outline-none focus:border-[#e06b6b] dark:border-stone-700 dark:bg-stone-950 dark:text-white">
                <option value="">{copy.allCapabilities}</option>
                {capabilities.map((option) => <option key={option.code} value={option.code}>{option.label} ({option.count})</option>)}
              </select>
            </label>

            <label>
              <span className="sr-only">{copy.deliverableLabel}</span>
              <select value={deliverable} onChange={(event) => setDeliverable(event.target.value)} className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-800 outline-none focus:border-[#e06b6b] dark:border-stone-700 dark:bg-stone-950 dark:text-white">
                <option value="">{copy.allDeliverables}</option>
                {deliverables.map((option) => <option key={option.code} value={option.label}>{option.label} ({option.count})</option>)}
              </select>
            </label>

            <label>
              <span className="sr-only">{copy.sortLabel}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'name')} className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-800 outline-none focus:border-[#e06b6b] dark:border-stone-700 dark:bg-stone-950 dark:text-white">
                <option value="newest">{copy.newest}</option>
                <option value="name">{copy.nameSort}</option>
              </select>
            </label>
          </div>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {query && <span className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">“{query}”</span>}
              {industry && <span className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">{industries.find((item) => item.code === industry)?.label}</span>}
              {capability && <span className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">{capabilities.find((item) => item.code === capability)?.label}</span>}
              {deliverable && <span className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">{deliverable}</span>}
              <button type="button" onClick={clearFilters} className="px-2 py-1 text-xs font-semibold text-[#b65757] underline decoration-[#b65757]/30 underline-offset-4 hover:decoration-[#b65757]">{copy.clear}</button>
            </div>
          )}
        </div>

        {filteredProfiles.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <article key={profile.slug} className="group overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white shadow-[0_14px_50px_rgba(71,45,30,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(71,45,30,0.13)] dark:border-stone-700 dark:bg-stone-900">
                <Link href={`/${locale}/fde/${profile.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-stone-100" aria-label={`${copy.viewProfile}: ${profile.name}`}>
                  <Image
                    src={profile.coverUrl}
                    alt={`${profile.name} ${copy.latestEpisode}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1536px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold tracking-wide text-white backdrop-blur-md">EP {String(profile.episodeNumber).padStart(2, '0')}</span>
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-stone-800 backdrop-blur-md">{profile.industry.label}</span>
                </Link>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">{profile.name}</h3>
                      {profile.aliases.length > 0 && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{profile.aliases.join(' · ')}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-stone-400">{formatDate(profile.publishedAt, locale)}</span>
                  </div>
                  <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-stone-700 dark:text-stone-200">{profile.headline}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.capabilities.slice(0, 3).map((item) => (
                      <span key={item.code} className="rounded-full border border-[#e06b6b]/20 bg-[#fff5f2] px-3 py-1 text-xs text-[#9f4d4d] dark:bg-[#422526] dark:text-[#ffc5bd]">{item.label}</span>
                    ))}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-500 dark:text-stone-400">{profile.bioSnippet}</p>

                  <div className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
                    <Link href={`/${locale}/fde/${profile.slug}`} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-[#b65757] dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-[#f0a0a0]">
                      {copy.viewProfile}
                    </Link>
                    <a href={profile.xiaoyuzhouUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition hover:border-[#e06b6b] hover:text-[#b65757] dark:border-stone-700 dark:text-stone-200">
                      {copy.listen}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-20 text-center dark:border-stone-700 dark:bg-stone-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0ed] text-2xl dark:bg-[#422526]">⌕</div>
            <h3 className="mt-5 text-xl font-semibold text-stone-900 dark:text-white">{copy.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-500 dark:text-stone-400">{copy.emptyDescription}</p>
            <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#e06b6b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c85a5a]">{copy.clear}</button>
          </div>
        )}
      </section>
    </>
  );
}
