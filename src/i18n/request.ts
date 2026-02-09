import {getRequestConfig} from 'next-intl/server';
import {supportedLocales, defaultLocale, AppLocale} from './config';

// Request 级 i18n 配置：按请求语言加载对应消息
export default getRequestConfig(async ({ locale }: { locale?: string }) => {
  const rawLocale = locale ?? defaultLocale;
  const finalLocale: AppLocale = supportedLocales.includes(rawLocale as AppLocale) ? (rawLocale as AppLocale) : defaultLocale;

  // 调试输出（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info('[i18n][request] locale =', locale, 'finalLocale =', finalLocale);
  }

  // 动态加载对应语言的消息，保持最小 payload
  const messages = (await import(`../../messages/${finalLocale}.json`)).default;

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info('[i18n][request] loaded messages namespaces =', Object.keys(messages));
  }

  return {
    locale: finalLocale,
    messages
  };
});
