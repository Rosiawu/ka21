import episodeData from '@/data/podcast-episodes.json';
import taxonomyData from '@/data/podcast-guest-taxonomy.json';

export type GuestDirectoryLocale = 'zh' | 'en';

export type ShowNoteBlock = {
  type: 'paragraph' | 'heading' | 'timestamp';
  text: string;
  time?: string;
};

export type PodcastEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  guestLabel: string;
  publishedAt: string;
  duration: string;
  xiaoyuzhouUrl: string;
  coverUrl: string;
  audioUrl: string;
  guestBio: string;
  showNotes: ShowNoteBlock[];
};

export type GuestTaxonomyProfile = {
  episodeNumber: number;
  slug: string;
  names: string[];
  aliases: string[];
  headline: Record<GuestDirectoryLocale, string>;
  primaryIndustry: string;
  industries: string[];
  roles: string[];
  capabilities: string[];
  deliverables: string[];
  clientTypes: string[];
};

export type GuestProfile = GuestTaxonomyProfile & {
  episode: PodcastEpisode;
};

type TaxonomyLabels = Record<string, Record<GuestDirectoryLocale, string>>;

export const industryLabels: TaxonomyLabels = {
  'human-resources': { zh: '人力资源', en: 'Human Resources' },
  'enterprise-services': { zh: '企业服务', en: 'Enterprise Services' },
  education: { zh: '教育', en: 'Education' },
  finance: { zh: '金融财会', en: 'Finance & Accounting' },
  marketing: { zh: '营销增长', en: 'Marketing & Growth' },
  'ai-infrastructure': { zh: 'AI 基础设施', en: 'AI Infrastructure' },
  'media-content': { zh: '内容与传媒', en: 'Media & Content' },
  'software-internet': { zh: '互联网与软件', en: 'Internet & Software' },
  'ecommerce-crossborder': { zh: '跨境与电商', en: 'E-commerce & Cross-border' },
  manufacturing: { zh: '工业制造', en: 'Industrial Manufacturing' },
  energy: { zh: '能源', en: 'Energy' },
  automotive: { zh: '汽车', en: 'Automotive' },
  'user-research': { zh: '用户研究', en: 'User Research' },
  'games-entertainment': { zh: '游戏与娱乐', en: 'Games & Entertainment' },
  'advertising-brand': { zh: '广告与品牌', en: 'Advertising & Brand' },
  robotics: { zh: '机器人与具身智能', en: 'Robotics & Embodied AI' },
  community: { zh: '社群与开发者生态', en: 'Community & Developer Ecosystem' },
  healthcare: { zh: '医疗健康', en: 'Healthcare' },
  'real-estate': { zh: '房地产', en: 'Real Estate' },
  hospitality: { zh: '餐饮与生活服务', en: 'Hospitality & Lifestyle' },
  'consumer-services': { zh: '消费与生活服务', en: 'Consumer Services' },
  'government-media': { zh: '政务与融媒体', en: 'Government & Converged Media' },
};

export const roleLabels: TaxonomyLabels = {
  founder: { zh: '创始人', en: 'Founder' },
  executive: { zh: '企业负责人', en: 'Executive' },
  product: { zh: '产品专家', en: 'Product' },
  engineer: { zh: '工程师', en: 'Engineer' },
  consultant: { zh: '顾问', en: 'Consultant' },
  trainer: { zh: '讲师', en: 'Trainer' },
  creator: { zh: '内容创作者', en: 'Creator' },
  director: { zh: '导演', en: 'Director' },
  researcher: { zh: '研究者', en: 'Researcher' },
  operator: { zh: '业务操盘手', en: 'Operator' },
  educator: { zh: '教育工作者', en: 'Educator' },
  designer: { zh: '设计师', en: 'Designer' },
  'community-builder': { zh: '社群主理人', en: 'Community Builder' },
  student: { zh: '青年开发者', en: 'Young Developer' },
  producer: { zh: '制片人', en: 'Producer' },
};

export const capabilityLabels: TaxonomyLabels = {
  'enterprise-ai': { zh: '企业 AI 落地', en: 'Enterprise AI' },
  'ai-product': { zh: 'AI 产品与原型', en: 'AI Product & Prototyping' },
  'agent-knowledge': { zh: 'Agent 与知识库', en: 'Agents & Knowledge Bases' },
  'data-governance': { zh: '数据分析与治理', en: 'Data & Governance' },
  'ai-coding': { zh: 'AI 编程与自动化', en: 'AI Coding & Automation' },
  'aigc-content': { zh: 'AIGC 内容生产', en: 'AIGC Content' },
  'seo-geo-growth': { zh: 'SEO/GEO 与增长', en: 'SEO/GEO & Growth' },
  'training-change': { zh: '培训与组织赋能', en: 'Training & Enablement' },
  'user-research': { zh: '用户研究与产品策略', en: 'User Research & Product Strategy' },
  'crossborder-growth': { zh: '出海与跨境增长', en: 'International Growth' },
  'strategy-research': { zh: '行业研究与商业策略', en: 'Research & Business Strategy' },
  'ai-infrastructure': { zh: 'AI 基础设施', en: 'AI Infrastructure' },
  'algorithm-modeling': { zh: '算法与模型应用', en: 'Algorithms & Applied Models' },
  'community-operations': { zh: '社群与生态运营', en: 'Community Operations' },
  'digital-ip': { zh: '数字 IP 与创意', en: 'Digital IP & Creative' },
  'presentation-design': { zh: '演示与交互设计', en: 'Presentation & Interaction Design' },
};

export const deliverableLabels: TaxonomyLabels = {
  'diagnosis-strategy': { zh: '企业诊断与方案', en: 'Diagnosis & Strategy' },
  'training-workshop': { zh: '培训 / 工作坊', en: 'Training / Workshop' },
  'prototype-poc': { zh: '产品原型 / POC', en: 'Prototype / POC' },
  'system-workflow': { zh: '系统 / 工作流交付', en: 'Systems / Workflows' },
  'content-brand': { zh: '内容 / 品牌项目', en: 'Content / Brand Project' },
  'growth-overseas': { zh: '增长 / 出海项目', en: 'Growth / International Project' },
  'research-consulting': { zh: '研究 / 咨询报告', en: 'Research / Consulting' },
  'keynote-sharing': { zh: '演讲 / 分享', en: 'Keynote / Talk' },
  'ongoing-advisory': { zh: '长期顾问', en: 'Ongoing Advisory' },
  'user-research': { zh: '用户研究项目', en: 'User Research Project' },
  'media-production': { zh: '影视 / 广告制作', en: 'Media / Advertising Production' },
};

export const clientTypeLabels: TaxonomyLabels = {
  'government-soe': { zh: '政府与央国企', en: 'Government & SOEs' },
  'large-enterprise': { zh: '大型企业', en: 'Large Enterprises' },
  'small-medium-enterprise': { zh: '中小企业', en: 'SMEs' },
  'startup-team': { zh: '创业团队', en: 'Startups' },
  'education-institution': { zh: '学校与教育机构', en: 'Education Institutions' },
  'brand-content-team': { zh: '品牌与内容团队', en: 'Brand & Content Teams' },
  'overseas-team': { zh: '出海团队', en: 'International Teams' },
  'developer-community': { zh: '开发者社区', en: 'Developer Communities' },
  'research-institution': { zh: '科研机构', en: 'Research Institutions' },
  'individual-creator': { zh: '个人与创作者', en: 'Individuals & Creators' },
};

const episodes = episodeData.episodes as PodcastEpisode[];
const taxonomyProfiles = taxonomyData.profiles as GuestTaxonomyProfile[];
const episodeByNumber = new Map(episodes.map((episode) => [episode.episodeNumber, episode]));

export const guestProfiles: GuestProfile[] = taxonomyProfiles
  .map((profile) => {
    const episode = episodeByNumber.get(profile.episodeNumber);
    if (!episode) return null;
    return { ...profile, episode };
  })
  .filter((profile): profile is GuestProfile => Boolean(profile))
  .sort((left, right) => right.episodeNumber - left.episodeNumber);

export function getGuestProfile(slug: string) {
  return guestProfiles.find((profile) => profile.slug === slug) || null;
}

export function getLabel(labels: TaxonomyLabels, code: string, locale: GuestDirectoryLocale) {
  return labels[code]?.[locale] || code;
}

export function getDirectoryStats() {
  return {
    episodeCount: guestProfiles.length,
    guestCount: guestProfiles.reduce((sum, profile) => sum + profile.names.length, 0),
    industryCount: new Set(guestProfiles.flatMap((profile) => profile.industries)).size,
    capabilityCount: new Set(guestProfiles.flatMap((profile) => profile.capabilities)).size,
  };
}

export function getPrimaryIndustryCounts() {
  return Object.entries(
    guestProfiles.reduce<Record<string, number>>((counts, profile) => {
      counts[profile.primaryIndustry] = (counts[profile.primaryIndustry] || 0) + 1;
      return counts;
    }, {}),
  )
    .map(([code, count]) => ({ code, count }))
    .sort((left, right) => right.count - left.count || left.code.localeCompare(right.code));
}

export const podcastDirectorySource = {
  showName: episodeData.showName,
  source: episodeData.source,
  sourceUpdatedAt: episodeData.sourceUpdatedAt,
  taxonomyVersion: taxonomyData.version,
  taxonomyUpdatedAt: taxonomyData.updatedAt,
};
