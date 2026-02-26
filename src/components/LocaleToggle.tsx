"use client"; // 客户端组件：语言切换按钮（下拉选择），基于路径前缀切换，并保留查询参数

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {localeNames, supportedLocales, AppLocale} from '@/i18n/config'; // 从 config 导入
import {buildLocalePath} from '@/i18n/localeSwitch';

export default function LocaleToggle({ isIcon = false }: { isIcon?: boolean }) {
  // 当前路径与路由操作
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 根据路径推断当前语言（默认 zh）
  const currentLocale: AppLocale = (pathname?.startsWith('/en') ? 'en' : 'zh');
  const localeLabels: Record<AppLocale, string> =
    currentLocale === 'en'
      ? { zh: 'Chinese', en: 'English' }
      : localeNames;

  // 处理语言切换事件
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as AppLocale;
    if (value !== currentLocale) {
      // 设置标准化 Cookie
      document.cookie = `locale=${value}; Path=/; Max-Age=${31536000}; SameSite=Lax`;

      const newPath = buildLocalePath(pathname || '/', value);
      const query = searchParams?.toString();
      // 保留查询参数（例如 category、q 等）
      const finalUrl = query ? `${newPath}?${query}` : newPath;
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info('[i18n][client] LocaleToggle switch', { from: pathname, to: finalUrl, cookie: `locale=${value}` });
      }
      router.push(finalUrl);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 使用 emoji 作为语言图标，避免引入额外依赖 */}
      <span role="img" aria-label="language">🌐</span>
      <select
        aria-label={currentLocale === 'en' ? 'Switch language' : '切换语言'}
        className="bg-transparent text-sm outline-none hover:opacity-80 cursor-pointer"
        value={currentLocale}
        onChange={handleChange}
      >
        {supportedLocales.map((loc) => (
          <option key={loc} value={loc} className="text-black dark:text-white">
            {isIcon ? loc : localeLabels[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
