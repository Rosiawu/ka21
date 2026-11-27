import type { Metadata } from 'next';
import DevLogSubmitPageContent from '@/components/devlog/DevLogSubmitPageContent';
import { generateHreflangMetadata } from '@/lib/hreflang';

export const dynamic = 'force-dynamic';

type DevLogSubmitPageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: DevLogSubmitPageParams }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const isEn = rawLocale === 'en';
  const hreflang = generateHreflangMetadata(isEn ? 'en' : 'zh', 'devlog/submit');

  return {
    title: isEn ? 'Submit Development Log - KA21 Tools' : '开发日志提交 - KA21工具导航',
    description: isEn
      ? 'Submit a development log from the web. It is written to GitHub and published on the next deploy.'
      : '在网页提交开发日志，自动写入 GitHub 并等待部署更新。',
    alternates: {
      canonical: hreflang.canonical,
      languages: hreflang.languages,
    },
  };
}

export default async function DevLogSubmitPage({ params }: { params: DevLogSubmitPageParams }) {
  const { locale } = await params;
  return <DevLogSubmitPageContent locale={locale === 'en' ? 'en' : 'zh'} />;
}
