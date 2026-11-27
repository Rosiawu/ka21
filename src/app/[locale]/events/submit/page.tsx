import type { Metadata } from 'next';
import EventSubmitPageContent from '@/components/events/EventSubmitPageContent';
import { generateHreflangMetadata } from '@/lib/hreflang';

type EventSubmitPageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: EventSubmitPageParams }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const isEn = rawLocale === 'en';
  const hreflang = generateHreflangMetadata(isEn ? 'en' : 'zh', 'events/submit');

  return {
    title: isEn ? 'Submit an Event - KA21 Tools' : '赛事区投稿 - KA21工具导航',
    description: isEn
      ? 'Submit an event post from your phone. It is added to the event board on the next deploy.'
      : '在手机提交赛事帖子，自动写入赛事区并等待部署更新。',
    alternates: {
      canonical: hreflang.canonical,
      languages: hreflang.languages,
    },
  };
}

export default async function EventSubmitPage({ params }: { params: EventSubmitPageParams }) {
  const { locale } = await params;
  return <EventSubmitPageContent locale={locale === 'en' ? 'en' : 'zh'} />;
}
