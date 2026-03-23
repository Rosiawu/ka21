import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import LocaleTag from '@/components/LocaleTag';
import LocaleShell from '@/components/LocaleShell';
import {generateHreflangMetadata} from '@/lib/hreflang';
import {isSupportedLocale, type AppLocale} from '@/i18n/config';

function requireLocale(locale: string): AppLocale {
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  return locale;
}

export function generateStaticParams() {
  return [{ locale: 'zh' }, { locale: 'en' }];
}

// 生成多语言元数据（标题/描述/多语言链接）
export async function generateMetadata({
  params
}: {
  params: {locale: string}
}): Promise<Metadata> {
  const locale = requireLocale(params.locale);
  // 直接按路径参数加载对应语言的消息，避免依赖 request 级 locale 注入
  type Messages = typeof import('../../../messages/en.json');
  const messages = (await import(`../../../messages/${locale}.json`)).default as Messages;

  // 生成hreflang标签（首页路径为空）
  const hreflangConfig = generateHreflangMetadata(locale, '');

  return {
    title: messages.Common?.siteTitle,
    description: messages.Home?.subtitle,
    alternates: {
      canonical: hreflangConfig.canonical,
      languages: hreflangConfig.languages
    }
  };
}

// 语言布局：提供 next-intl 上下文，并承载需要多语言的全局 UI（头部/侧边栏/页脚）
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const locale = requireLocale(params.locale);
  // Ensure server-side translations use the active locale
  setRequestLocale(locale);
  // 按路径参数直接加载消息，确保与当前语言一致
  type Messages = typeof import('../../../messages/en.json');
  const messages = (await import(`../../../messages/${locale}.json`)).default as Messages;

  // 调试输出（仅开发环境或显式开启 DEBUG_I18N=1 时）
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_I18N === '1') {
    // eslint-disable-next-line no-console
    console.info('[i18n][server] [locale]/layout params.locale =', locale, 'siteTitle =', messages.Common?.siteTitle);
  }

  // Note: html/body are defined in the root layout. This layout only provides i18n context.
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* 设置 Clarity 语言标签 */}
      <LocaleTag locale={locale} />

      <LocaleShell>
        {children}
      </LocaleShell>
    </NextIntlClientProvider>
  );
}
