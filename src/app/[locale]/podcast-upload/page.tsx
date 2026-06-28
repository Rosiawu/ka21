import type { Metadata } from 'next';
import PodcastUploadPageContent from '@/components/podcast/PodcastUploadPageContent';

type PodcastUploadPageParams = Promise<{ locale: string }>;

export const metadata: Metadata = {
  title: '播客上传 - KA21 AI牛马库',
  description: '灯下白播客上传入口。',
};

export default async function PodcastUploadPage({
  params,
}: {
  params: PodcastUploadPageParams;
}) {
  const { locale: routeLocale } = await params;
  const locale = routeLocale === 'en' ? 'en' : 'zh';
  return <PodcastUploadPageContent locale={locale} />;
}
