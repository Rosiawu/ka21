import type { Metadata } from 'next';
import DevLogSubmitPageContent from '@/components/devlog/DevLogSubmitPageContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '开发日志提交',
  description: '手机端快速提交开发日志，自动写入 GitHub 并等待部署更新。',
};

type DevLogSubmitPageParams = Promise<{ locale: string }>;

export default async function DevLogSubmitPage({ params }: { params: DevLogSubmitPageParams }) {
  const { locale } = await params;
  return <DevLogSubmitPageContent locale={locale === 'en' ? 'en' : 'zh'} />;
}
