import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import { getDealById } from '@/lib/deals/store';
import DealDetailPage from '@/components/deals/DealDetailPage';

export const dynamic = 'force-dynamic';

type DealDetailPageParams = Promise<{ locale: string; id: string }>;

export async function generateMetadata(
  { params }: { params: DealDetailPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: routeLocale, id } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  const deal = await getDealById(id);
  const hreflangConfig = generateHreflangMetadata(locale, `deals/${id}`);
  return withBaseMeta({ title: deal?.title || (locale === 'en' ? 'Deal Detail - KA21 Tools' : '羊毛详情 - KA21工具导航'), description: deal?.benefitInfo || deal?.rawText?.slice(0, 120) || '', alternates: { canonical: hreflangConfig.canonical, languages: hreflangConfig.languages } }, parent);
}

export default async function DealDetailRoute({ params }: { params: DealDetailPageParams }) {
  const { locale, id } = await params;
  const deal = await getDealById(id);
  if (!deal) notFound();
  return <DealDetailPage locale={locale} deal={deal} />;
}
