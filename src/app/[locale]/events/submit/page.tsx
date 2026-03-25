import type { Metadata } from 'next';
import EventSubmitPageContent from '@/components/events/EventSubmitPageContent';

export const metadata: Metadata = {
  title: '赛事区投稿',
  description: '手机端快速提交赛事帖子，自动写入赛事区并等待部署更新。',
};

type EventSubmitPageParams = Promise<{ locale: string }>;

export default async function EventSubmitPage({ params }: { params: EventSubmitPageParams }) {
  const { locale } = await params;
  return <EventSubmitPageContent locale={locale === 'en' ? 'en' : 'zh'} />;
}
