import type { Metadata } from 'next';
import DevLogSubmitPageContent from '@/components/devlog/DevLogSubmitPageContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '开发日志提交',
  description: '手机端快速提交开发日志，自动写入 GitHub 并等待部署更新。',
};

export default function DevLogSubmitPage({ params }: { params: { locale: string } }) {
  return <DevLogSubmitPageContent locale={params.locale === 'en' ? 'en' : 'zh'} />;
}
