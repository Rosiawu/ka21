import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { getContributorProfile } from '@/lib/deals/store';
import ContributorProfilePage from '@/components/deals/ContributorProfilePage';

export const dynamic = 'force-dynamic';

type ContributorPageParams = Promise<{ locale: string; id: string }>;

export async function generateMetadata(
  { params }: { params: ContributorPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: routeLocale, id } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  const profile = await getContributorProfile(id);
  const hreflangConfig = generateHreflangMetadata(locale, `contributors/${id}`);
  return withBaseMeta({ title: profile ? `${profile.contributor.nickname} - ${locale === 'en' ? 'Contributor' : '贡献者主页'}` : (locale === 'en' ? 'Contributor - KA21 Tools' : '贡献者主页 - KA21工具导航'), description: profile?.contributor.bio || '', alternates: { canonical: hreflangConfig.canonical, languages: hreflangConfig.languages } }, parent);
}

export default async function ContributorPage({ params }: { params: ContributorPageParams }) {
  const { locale, id } = await params;
  const profile = await getContributorProfile(id);
  if (!profile) notFound();
  return <ContributorProfilePage locale={locale} profile={profile} />;
}
