import type { Metadata } from 'next';
import EventSubmitPageContent from '@/components/events/EventSubmitPageContent';

export const metadata: Metadata = {
  title: '赛事区投稿',
  description: '手机端快速提交赛事帖子，自动写入赛事区并等待部署更新。',
};

export default function EventSubmitPage({ params }: { params: { locale: string } }) {
  return <EventSubmitPageContent locale={params.locale === 'en' ? 'en' : 'zh'} />;
}
