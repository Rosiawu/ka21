import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import toolsData from '../src/data/tools.json';
import tutorialsData from '../src/data/tutorials.json';
import { TOOL_CATEGORIES } from '../src/data/toolCategories';
import { teamMembers } from '../src/data/team-members';

type ToolRecord = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  icons?: { svg?: string; png?: string };
  url: string;
  tags?: string[];
  toolCategory?: string;
  recommendLevel?: string;
  accessibility?: string;
  displayOrder?: number;
  guides?: Array<{ title: string; content: string; type?: string }>;
  relatedTutorials?: string[];
  groupComments?: Array<{
    content: string;
    author?: string;
    createdAt?: string;
    reviewType?: string;
  }>;
  isVisible?: boolean;
};

type TutorialRecord = {
  id: string;
  title: string;
  url: string;
  source?: string;
  publishDate?: string;
  difficultyLevel?: string;
  category?: string;
  skillTags?: string[];
  recommendReason?: string;
  customImageUrl?: string;
  relatedTools?: string[];
};

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'miniprogram', 'data');
const targetPublicDir = path.join(rootDir, 'miniprogram', 'public');
const assetBaseUrl = (process.env.MINIAPP_ASSET_BASE_URL || 'https://ka21.tools').replace(/\/+$/, '');

const MINIAPP_CATEGORY_ICONS: Record<string, string> = {
  writing: '/icons/categories/pen.svg',
  image: '/icons/categories/palette.svg',
  video: '/icons/categories/chart.svg',
  audio: '/icons/categories/headset.svg',
  office: '/icons/categories/briefcase.svg',
  coding: '/icons/categories/chip.svg',
  utils: '/icons/categories/settings.svg',
};

const TUTORIAL_CATEGORY_LABEL_MAP: Record<string, string> = {
  'office-productivity': 'AI办公',
};

const sortByDateDesc = (a: string, b: string) => {
  return new Date(b).getTime() - new Date(a).getTime();
};

const toAbsoluteAssetUrl = (rawPath: string | undefined) => {
  if (!rawPath || typeof rawPath !== 'string') return '';
  if (/^https?:\/\//.test(rawPath)) return rawPath;
  if (rawPath.startsWith('/')) return `${assetBaseUrl}${rawPath}`;
  return `${assetBaseUrl}/${rawPath.replace(/^\/+/, '')}`;
};

const normalizeTool = (tool: ToolRecord) => {
  const icon = toAbsoluteAssetUrl(tool.icons?.svg || tool.icons?.png || tool.icon || '');
  return {
    ...tool,
    icon,
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    guides: Array.isArray(tool.guides) ? tool.guides : [],
    relatedTutorials: Array.isArray(tool.relatedTutorials) ? tool.relatedTutorials : [],
    groupComments: Array.isArray(tool.groupComments) ? tool.groupComments : [],
  };
};

const normalizeTutorial = (tutorial: TutorialRecord) => {
  const normalizedCategory = TUTORIAL_CATEGORY_LABEL_MAP[tutorial.category || ''] || (tutorial.category || '');
  return {
    ...tutorial,
    author: tutorial.source || '',
    imageUrl: toAbsoluteAssetUrl(tutorial.customImageUrl || ''),
    category: normalizedCategory,
    skillTags: Array.isArray(tutorial.skillTags) ? tutorial.skillTags : [],
    relatedTools: Array.isArray(tutorial.relatedTools) ? tutorial.relatedTools : [],
  };
};

async function main() {
  await mkdir(outputDir, { recursive: true });
  await rm(targetPublicDir, { recursive: true, force: true });

  const tools = (toolsData.tools as ToolRecord[])
    .filter((tool) => tool.isVisible !== false)
    .map(normalizeTool)
    .sort((a, b) => {
      const categoryCompare = (a.toolCategory || '').localeCompare(b.toolCategory || '');
      if (categoryCompare !== 0) return categoryCompare;
      return (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999);
    });

  const tutorials = (tutorialsData.tutorials as TutorialRecord[])
    .map(normalizeTutorial)
    .sort((a, b) => sortByDateDesc(a.publishDate || '', b.publishDate || ''));

  const categories = TOOL_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description || '',
    icon: toAbsoluteAssetUrl(
      MINIAPP_CATEGORY_ICONS[category.id] || category.icon || '/icons/categories/briefcase.svg',
    ),
  }));

  const members = teamMembers.map((member) => ({
    id: member.id,
    name: member.name,
    title: member.title,
    avatar: toAbsoluteAssetUrl(member.avatar),
    location: member.location,
    specialty: member.specialty,
    nickname: member.nickname,
    wechatQR: toAbsoluteAssetUrl(member.wechatQR),
    wechatAccount: member.wechatAccount,
    aiTools: member.aiTools || [],
    description: member.description || '',
    skills: member.skills || [],
    projectHighlights: member.projectHighlights || [],
    personalTraits: member.personalTraits || [],
  }));

  await Promise.all([
    writeFile(path.join(outputDir, 'tools.json'), JSON.stringify({ tools }, null, 2), 'utf8'),
    writeFile(path.join(outputDir, 'tutorials.json'), JSON.stringify({ tutorials }, null, 2), 'utf8'),
    writeFile(path.join(outputDir, 'categories.json'), JSON.stringify({ categories }, null, 2), 'utf8'),
    writeFile(path.join(outputDir, 'team-members.json'), JSON.stringify({ teamMembers: members }, null, 2), 'utf8'),
    writeFile(
      path.join(outputDir, 'tools.js'),
      `module.exports = ${JSON.stringify({ tools }, null, 2)};\n`,
      'utf8',
    ),
    writeFile(
      path.join(outputDir, 'tutorials.js'),
      `module.exports = ${JSON.stringify({ tutorials }, null, 2)};\n`,
      'utf8',
    ),
    writeFile(
      path.join(outputDir, 'categories.js'),
      `module.exports = ${JSON.stringify({ categories }, null, 2)};\n`,
      'utf8',
    ),
    writeFile(
      path.join(outputDir, 'team-members.js'),
      `module.exports = ${JSON.stringify({ teamMembers: members }, null, 2)};\n`,
      'utf8',
    ),
  ]);

  // eslint-disable-next-line no-console
  console.log(`Mini program data exported to: ${outputDir}`);
  // eslint-disable-next-line no-console
  console.log(`tools=${tools.length}, tutorials=${tutorials.length}, teamMembers=${members.length}`);
  // eslint-disable-next-line no-console
  console.log(`asset base url=${assetBaseUrl}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to export mini program data:', error);
  process.exit(1);
});
