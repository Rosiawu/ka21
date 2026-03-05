import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';
import { tutorials } from '@/data/tutorials';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.tools';
  const locales = ['zh', 'en'];

  // 基础页面
  const basePages = [
    '',
    '/about',
    '/devlog',
    '/search',
    '/unified-search',
    '/tutorials',
    '/llm-articles',
    '/test-clarity'
  ];

  // 生成多语言页面
  const localizedPages = locales.flatMap(locale =>
    basePages.map(page => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.8,
    }))
  );

  // 工具详情页
  const toolPages = toolsData.tools
    .filter(tool => tool.isVisible !== false)
    .map(tool => ({
      url: `${baseUrl}/zh/tools/${tool.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  // 英文工具页
  const toolPagesEn = toolsData.tools
    .filter(tool => tool.isVisible !== false)
    .map(tool => ({
      url: `${baseUrl}/en/tools/${tool.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  // 教程页面（如果有独立页面）
  const tutorialPages = tutorials.map(tutorial => ({
    url: `${baseUrl}/zh/tutorials#${tutorial.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...localizedPages,
    ...toolPages,
    ...toolPagesEn,
    ...tutorialPages,
  ];
}
