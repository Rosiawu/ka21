/**
 * Hreflang标签生成工具
 * 用于SEO优化，帮助搜索引擎理解多语言页面之间的对应关系
 */

export interface HreflangConfig {
  canonical: string;
  languages: {
    'zh': string;
    'en': string;
    'x-default': string;
  };
}

/**
 * 生成hreflang标签配置
 * @param baseUrl 网站基础URL
 * @param currentLocale 当前语言
 * @param path 当前页面路径（不包含语言前缀）
 * @returns hreflang配置对象
 */
/**
 * App routes use Next's no-trailing-slash policy (`/zh`, not `/zh/`).
 * An empty path is the locale homepage and must not become a trailing slash,
 * because `/zh/` 308-redirects to `/zh`.
 */
export function normalizeCanonicalPath(path: string = ''): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') return '';

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
}

export function generateHreflangTags(
  baseUrl: string,
  currentLocale: string,
  path: string = ''
): HreflangConfig {
  const siteOrigin = baseUrl.replace(/\/+$/, '');
  const fullPath = normalizeCanonicalPath(path);

  return {
    canonical: `${siteOrigin}/${currentLocale}${fullPath}`,
    languages: {
      'zh': `${siteOrigin}/zh${fullPath}`,
      'en': `${siteOrigin}/en${fullPath}`,
      'x-default': `${siteOrigin}/zh${fullPath}` // 默认语言为中文
    }
  };
}

/**
 * 获取网站基础URL
 * @returns 网站基础URL
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 开发环境默认值
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // 生产环境默认值
  return 'https://ka21.org';
}

/**
 * 为页面生成完整的hreflang metadata
 * @param currentLocale 当前语言
 * @param path 当前页面路径
 * @returns 包含hreflang的Metadata配置
 */
export function generateHreflangMetadata(
  currentLocale: string,
  path: string = ''
) {
  const baseUrl = getBaseUrl();
  return generateHreflangTags(baseUrl, currentLocale, path);
}
