import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';
import devLogSubmissions from '@/data/devlog-submissions.json';
import { guestProfiles, podcastDirectorySource } from '@/lib/podcastGuests';
import personalArticles from '../../data/personal-site/articles.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.org';
  const locales = ['zh', 'en'];
  const latestDevLogDate = devLogSubmissions.entries
    .map((entry) => entry.date)
    .sort((left, right) => right.localeCompare(left))[0];
  const latestSiteUpdate = new Date(
    [personalArticles.updatedAt, podcastDirectorySource.sourceUpdatedAt, latestDevLogDate]
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .reduce((latest, value) => Math.max(latest, value), 0),
  );

  // Only canonical, indexable landing pages belong in the sitemap.
  const basePages = [
    '',
    '/about',
    '/devlog',
    '/events',
    '/tools',
    '/tutorials',
    '/llm-articles',
    '/fde',
    '/deals',
  ];

  const localizedPages = locales.flatMap(locale =>
    basePages.map(page => ({
      url: `${baseUrl}/${locale}${page}`,
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.8,
      ...(page === '/fde' ? { lastModified: new Date(podcastDirectorySource.sourceUpdatedAt) } : {}),
      ...(page === '/devlog' && latestDevLogDate ? { lastModified: new Date(latestDevLogDate) } : {}),
    }))
  );

  const toolPages = locales.flatMap((locale) =>
    toolsData.tools
      .filter(tool => tool.isVisible !== false)
      .map(tool => ({
        url: `${baseUrl}/${locale}/tools/${tool.id}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
  );

  const fdeProfilePages = locales.flatMap(locale =>
    guestProfiles.map(profile => ({
      url: `${baseUrl}/${locale}/fde/${profile.slug}`,
      lastModified: new Date(profile.episode.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }))
  );

  return [
    {
      url: baseUrl,
      lastModified: latestSiteUpdate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/personal-site/`,
      lastModified: new Date(personalArticles.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/podcast-dashboard/`,
      lastModified: new Date(podcastDirectorySource.sourceUpdatedAt),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...localizedPages,
    ...toolPages,
    ...fdeProfilePages,
  ];
}
