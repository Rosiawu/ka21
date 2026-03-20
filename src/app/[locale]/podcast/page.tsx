import { redirect } from 'next/navigation';

export default function PodcastPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === 'en' ? 'en' : 'zh';
  redirect(`/podcast-dashboard/index.html?locale=${locale}`);
}
