import taxonomy from '@/data/podcast-guest-taxonomy.json';
import personalArticles from '../../../data/personal-site/articles.json';
import podcastEpisodes from '@/data/podcast-episodes.json';

export const dynamic = 'force-static';

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.org';
  const profiles = taxonomy.profiles
    .map((profile) => `- ${profile.names.join(' & ')} — ${profile.headline.zh}: ${baseUrl}/zh/fde/${profile.slug}`)
    .join('\n');

  const content = `# KA21 AI 牛马库

> KA21（AI 牛马库）是吴熳维护的双语 AI 实践资源站，收录真实使用过的 AI 工具、教程、公众号文章、《灯下白》播客数据和跨行业 AI 实践者目录。

## Canonical pages

- 中文首页: ${baseUrl}/zh
- English home: ${baseUrl}/en
- AI 工具: ${baseUrl}/zh/tools
- 实用教程: ${baseUrl}/zh/tutorials
- 吴熳的公众号文章（${personalArticles.total} 篇）: ${baseUrl}/personal-site/
- 《灯下白》播客数据（${podcastEpisodes.episodeCount} 期）: ${baseUrl}/podcast-dashboard/
- 灯下白 FDE 人才图谱: ${baseUrl}/zh/fde
- English FDE directory: ${baseUrl}/en/fde
- SEO / GEO 效果看板: ${baseUrl}/zh/seo-geo
- 开发日志: ${baseUrl}/zh/devlog

## Machine-readable resources

- Sitemap: ${baseUrl}/sitemap.xml
- FDE catalog: ${baseUrl}/fde-catalog.json
- This file: ${baseUrl}/llms.txt

## Editorial principles

- 工具与教程以实际使用和可复现经验为优先，不以收录数量代替判断。
- 公众号文章保留原始标题、日期、分类和原文链接。
- FDE 人才图谱来自《灯下白》公开访谈；每一期独立成页，即使同一嘉宾多次出现也不会覆盖旧访谈。
- Profile capability labels summarize public interviews and are not endorsements or guarantees.

## FDE profiles

${profiles}
`;

  return new Response(content, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
