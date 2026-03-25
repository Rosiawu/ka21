import type { Metadata, ResolvingMetadata } from 'next';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { listApprovedDeals } from '@/lib/deals/store';
import DealsHubPage from '@/components/deals/DealsHubPage';

export const dynamic = 'force-dynamic';

type DealsPageParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: DealsPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  const hreflangConfig = generateHreflangMetadata(locale, 'deals');
  return withBaseMeta({ title: locale === 'en' ? 'Benefit Zone - KA21 Tools' : '羊毛区 - KA21工具导航', description: locale === 'en' ? 'Community-submitted deals, promo credits, invite codes, and price drops.' : '社区投稿的优惠、额度赠送、邀请码和价格变动信息。', alternates: { canonical: hreflangConfig.canonical, languages: hreflangConfig.languages } }, parent);
}

export default async function DealsPage({ params }: { params: DealsPageParams }) {
  const { locale } = await params;
  const deals = await listApprovedDeals();
  return <DealsHubPage locale={locale} deals={deals.sort((a, b) => b.createdAt.localeCompare(a.createdAt))} />;
}
