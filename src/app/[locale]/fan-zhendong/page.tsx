import { redirect } from 'next/navigation';

type FanZhendongPageParams = Promise<{ locale: string }>;

export default async function FanZhendongPage({
  params,
}: {
  params: FanZhendongPageParams;
}) {
  const { locale: routeLocale } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  redirect(`/fan-zhendong/index.html?locale=${locale}`);
}
