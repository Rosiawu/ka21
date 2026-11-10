import taxonomy from '@/data/podcast-guest-taxonomy.json';

export const dynamic = 'force-static';

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.org';
  const profiles = taxonomy.profiles
    .map((profile) => `- ${profile.names.join(' & ')} — ${profile.headline.zh}: ${baseUrl}/zh/fde/${profile.slug}`)
    .join('\n');

  const content = `# 灯下白 FDE 人才图谱 / Dengxiabai FDE Network

> 从《灯下白》公开深度访谈中整理的跨行业 AI 实践者与交付能力目录。用于帮助企业寻找企业 AI、数据治理、AI 产品、AIGC、教育培训、SEO/GEO、出海增长等方向的实践者。

## Canonical pages

- 中文人才图谱: ${baseUrl}/zh/fde
- English directory: ${baseUrl}/en/fde
- Machine-readable catalog: ${baseUrl}/fde-catalog.json
- Podcast source: https://www.xiaoyuzhoufm.com/podcast/69a44f5aa19c08db64bbd8a7

## Business contact

- Curator: 吴熳 / Wu Man
- Telephone: +86 139 1134 9663
- Note: Prices are not published. Scope, availability and proposals are confirmed by the curator.

## Taxonomy

Profiles are classified by industry, professional role, core capability, potential deliverable and relevant client type. Capability labels are derived from public interviews and do not guarantee availability for every project.

## Profiles

${profiles}
`;

  return new Response(content, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
