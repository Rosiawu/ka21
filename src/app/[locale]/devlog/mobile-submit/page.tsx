import type { Metadata } from 'next';
import DevLogSubmitPageContent from '@/components/devlog/DevLogSubmitPageContent';
import { generateHreflangMetadata } from '@/lib/hreflang';

export const dynamic = 'force-dynamic';

type DevLogMobileSubmitPageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: DevLogMobileSubmitPageParams }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const isEn = rawLocale === 'en';
  const hreflang = generateHreflangMetadata(isEn ? 'en' : 'zh', 'devlog/mobile-submit');

  return {
    title: isEn ? 'Submit Development Log - KA21 Tools' : '开发日志提交 - KA21工具导航',
    description: isEn
      ? 'Submit a development log from a phone. It is written to GitHub and published on the next deploy.'
      : '在手机提交开发日志，自动写入 GitHub 并等待部署更新。',
    alternates: {
      canonical: hreflang.canonical,
      languages: hreflang.languages,
    },
  };
}

export default async function DevLogMobileSubmitPage({ params }: { params: DevLogMobileSubmitPageParams }) {
  const { locale } = await params;
  return <DevLogSubmitPageContent locale={locale === 'en' ? 'en' : 'zh'} />;
}
