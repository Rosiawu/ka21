'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

// 统一封装 next-themes 默认配置，避免各处重复设置。

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange // 切换主题时移除过渡，避免闪屏
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
