import { redirect } from 'next/navigation';

type PersonalPageParams = Promise<{ locale: string }>;

export default async function PersonalPage({
  params,
}: {
  params: PersonalPageParams;
}) {
  const { locale: routeLocale } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  redirect(`/personal-site/index.html?locale=${locale}`);
}
