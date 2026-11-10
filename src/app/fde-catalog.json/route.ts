import taxonomy from '@/data/podcast-guest-taxonomy.json';

export const dynamic = 'force-static';

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.org';
  const payload = {
    name: '灯下白 FDE 人才图谱',
    description: '基于《灯下白》公开深度访谈整理的跨行业 AI 实践者与交付能力目录。',
    taxonomyVersion: taxonomy.version,
    updatedAt: taxonomy.updatedAt,
    contact: {
      name: '吴熳',
      telephone: '+86-139-1134-9663',
    },
    pricing: 'Not published; contact the curator for scope and proposal.',
    profiles: taxonomy.profiles.map((profile) => ({
      episodeNumber: profile.episodeNumber,
      names: profile.names,
      aliases: profile.aliases,
      headline: profile.headline,
      primaryIndustry: profile.primaryIndustry,
      industries: profile.industries,
      roles: profile.roles,
      capabilities: profile.capabilities,
      deliverables: profile.deliverables,
      clientTypes: profile.clientTypes,
      profileUrl: `${baseUrl}/zh/fde/${profile.slug}`,
      englishProfileUrl: `${baseUrl}/en/fde/${profile.slug}`,
    })),
  };

  return Response.json(payload, {
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
