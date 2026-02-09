"use client"; // 客户端组件：用于在浏览器侧设置 Clarity 的语言标签

import { useEffect } from 'react';
import { setTag } from '@/utils/clarity';

export default function LocaleTag({ locale }: { locale: string }) {
  // 组件挂载/语言变更时，设置 Clarity 会话标签，便于区分语言环境
  useEffect(() => {
    if (locale) {
      try {
        setTag('locale', locale);
      } catch {
        // 若 Clarity 尚未就绪，静默忽略（避免阻塞页面渲染）
      }
      // 调试输出（仅开发环境或显式开启 NEXT_PUBLIC_DEBUG_I18N=1 时）
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_I18N === '1') {
        // eslint-disable-next-line no-console
        console.info('[i18n][client] LocaleTag mounted, locale =', locale);
      }
    }
  }, [locale]);

  // 同步 <html lang>，提升可访问性与 SEO 语义
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const lang = locale === 'en' ? 'en' : 'zh-CN';
      document.documentElement.setAttribute('lang', lang);
    }
  }, [locale]);

  // 无需渲染任何 UI
  return null;
}
