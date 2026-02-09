import {Suspense} from 'react';
import {setRequestLocale} from 'next-intl/server';
import HomeContent from '@/components/HomeContent';
import ChatWidget from '@/components/ChatWidget';
import StructuredData from '@/components/StructuredData';

export default async function Home({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  // 直接按路径参数加载对应语言消息，避免受 request 级 locale 影响
  type Messages = typeof import('../../../messages/en.json');
  const messages = (await import(`../../../messages/${params.locale}.json`)).default as Messages;
  const subtitle = messages.Home?.subtitle as string;

  // 调试输出（仅开发环境或显式开启 DEBUG_I18N=1 时）
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_I18N === '1') {
    // eslint-disable-next-line no-console
    console.info('[i18n][server] [locale]/page params.locale =', params.locale, 'Home.subtitle =', subtitle);
  }

  return (
    <main>
      <StructuredData
        type="WebPage"
        title="KA21工具导航 - 一站式AI资源平台"
        description={subtitle}
        url={`/${params.locale}`}
      />
      <StructuredData type="Organization" />
      <Suspense fallback={<div className="relative overflow-hidden animate-pulse" />}>
        <HomeContent subtitle={subtitle} />
        <ChatWidget />
      </Suspense>
    </main>
  );
}
