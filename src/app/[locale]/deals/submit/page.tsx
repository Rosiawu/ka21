import type { Metadata, ResolvingMetadata } from 'next';
import { withBaseMeta } from '@/lib/withBaseMeta';
import { generateHreflangMetadata } from '@/lib/hreflang';
import DealSubmitPageContent from '@/components/deals/DealSubmitPageContent';

export const dynamic = 'force-dynamic';

type DealsSubmitPageParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: DealsSubmitPageParams },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  const hreflangConfig = generateHreflangMetadata(locale, 'deals/submit');
  return withBaseMeta({ title: locale === 'en' ? 'Submit Deal - KA21 Tools' : '投稿羊毛 - KA21工具导航', description: locale === 'en' ? 'Submit a promo or deal with text, image proof, and auto pre-check.' : '通过文字、截图和自动预审来投稿羊毛信息。', alternates: { canonical: hreflangConfig.canonical, languages: hreflangConfig.languages } }, parent);
}

export default async function DealsSubmitPage({ params }: { params: DealsSubmitPageParams }) {
  const { locale } = await params;
  return <DealSubmitPageContent locale={locale} />;
}
