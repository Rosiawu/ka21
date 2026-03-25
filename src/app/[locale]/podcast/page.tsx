import { redirect } from 'next/navigation';

type PodcastPageParams = Promise<{ locale: string }>;

export default async function PodcastPage({
  params,
}: {
  params: PodcastPageParams;
}) {
  const { locale: routeLocale } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  redirect(`/podcast-dashboard/index.html?locale=${locale}`);
}
