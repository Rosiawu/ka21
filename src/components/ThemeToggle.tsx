'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

// 前端暗黑模式开关，通过 next-themes 切换主题。
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isEn = useLocale() === 'en';
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 根据 next-themes 解析结果判断当前是否处于暗色模式。
  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme]);

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors duration-200"
      aria-label={
        isDark
          ? (isEn ? 'Switch to light mode' : '切换到日间模式')
          : (isEn ? 'Switch to dark mode' : '切换到夜间模式')
      }
    >
      {mounted ? (
        isDark ? (
          <SunIcon className="h-5 w-5 text-neutral-200" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )
      ) : (
        // Hydration 前占位，防止按钮位置抖动。
        <span className="inline-block h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
