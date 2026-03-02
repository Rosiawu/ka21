import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import toolsData from '../src/data/tools.json';
import tutorialsData from '../src/data/tutorials.json';
import weeklyPicksData from '../src/data/weekly-picks.json';
import tutorialFulltextData from '../src/data/miniapp-tutorial-fulltext.json';
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

type WeeklyPicksRecord = {
  toolIds?: string[];
  maxItems?: number;
};

type FulltextItem = {
  id?: string;
  cover?: string;
};

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'miniprogram', 'data');
const targetPublicDir = path.join(rootDir, 'miniprogram', 'public');
const tutorialCoverSourceDir = path.join(rootDir, 'public', 'images', 'tutorials');
const tutorialCoverOutputDir = path.join(rootDir, 'miniprogram', 'tutorial-covers');
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

function toMiniappImageUrl(rawUrl: string): string {
  const normalized = (rawUrl || '').trim();
  if (!normalized) return '';
  return normalized;
}

function extractTutorialCoverFilename(coverUrl: string): string {
  const normalized = (coverUrl || '').trim();
  if (!normalized) return '';

  const marker = '/images/tutorials/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return '';

  const candidate = normalized.slice(markerIndex + marker.length).split(/[?#]/)[0];
  if (!candidate || candidate.includes('/')) return '';
  return candidate;
}

async function buildLocalTutorialCovers(tutorials: TutorialRecord[]): Promise<Record<string, string>> {
  await rm(tutorialCoverOutputDir, { recursive: true, force: true });
  await mkdir(tutorialCoverOutputDir, { recursive: true });

  const filenameSet = new Set<string>();
  for (const tutorial of tutorials) {
    const sourceCover = toAbsoluteAssetUrl(tutorial.customImageUrl || '');
    const filename = extractTutorialCoverFilename(sourceCover);
    if (filename) filenameSet.add(filename);
  }

  const localMap: Record<string, string> = {};
  for (const filename of filenameSet) {
    const sourcePath = path.join(tutorialCoverSourceDir, filename);
    const outputPath = path.join(tutorialCoverOutputDir, filename);
    const ext = path.extname(filename).toLowerCase();

    try {
      const pipeline = sharp(sourcePath).resize({
        width: 300,
        height: 188,
        fit: 'cover',
      });

      if (ext === '.png') {
        await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);
      } else if (ext === '.webp') {
        await pipeline.webp({ quality: 60 }).toFile(outputPath);
      } else {
        await pipeline.jpeg({ quality: 55, mozjpeg: true }).toFile(outputPath);
      }
    } catch {
      // fallback: 保底复制原图，避免导出中断
      await copyFile(sourcePath, outputPath);
    }

    localMap[filename] = `/tutorial-covers/${filename}`;
  }

  return localMap;
}

function resolveTutorialCover(
  tutorial: TutorialRecord,
  localTutorialCoverMap: Record<string, string>,
  fulltextCoverMap: Record<string, string>,
): string {
  const fulltextCover = fulltextCoverMap[tutorial.id] || '';
  if (fulltextCover) {
    return toMiniappImageUrl(toAbsoluteAssetUrl(fulltextCover));
  }

  const sourceCover = toAbsoluteAssetUrl(tutorial.customImageUrl || '');
  const filename = extractTutorialCoverFilename(sourceCover);
  if (filename && localTutorialCoverMap[filename]) {
    return localTutorialCoverMap[filename];
  }
  return toMiniappImageUrl(sourceCover);
}

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

  const tutorialRecords = (tutorialsData.tutorials as TutorialRecord[]) || [];
  const localTutorialCoverMap = await buildLocalTutorialCovers(tutorialRecords);
  const fulltextItems = ((tutorialFulltextData as { items?: FulltextItem[] }).items || []) as FulltextItem[];
  const fulltextCoverMap: Record<string, string> = {};
  for (const item of fulltextItems) {
    const id = (item?.id || '').trim();
    const cover = (item?.cover || '').trim();
    if (!id || !cover) continue;
    fulltextCoverMap[id] = cover;
  }

  const tutorials = tutorialRecords
    .map((tutorial) => {
      const normalizedCategory = TUTORIAL_CATEGORY_LABEL_MAP[tutorial.category || ''] || (tutorial.category || '');
      const sourceCover = toAbsoluteAssetUrl(tutorial.customImageUrl || '');
      const normalizedCover = resolveTutorialCover(tutorial, localTutorialCoverMap, fulltextCoverMap);

      return {
        ...tutorial,
        author: tutorial.source || '',
        imageUrl: normalizedCover,
        coverFallback: sourceCover && sourceCover !== normalizedCover ? sourceCover : '',
        category: normalizedCategory,
        skillTags: Array.isArray(tutorial.skillTags) ? tutorial.skillTags : [],
        relatedTools: Array.isArray(tutorial.relatedTools) ? tutorial.relatedTools : [],
      };
    })
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

  const weeklyPicksConfig = weeklyPicksData as WeeklyPicksRecord;
  const weeklyPicks = {
    toolIds: Array.isArray(weeklyPicksConfig.toolIds) ? weeklyPicksConfig.toolIds : [],
    maxItems: typeof weeklyPicksConfig.maxItems === 'number' ? weeklyPicksConfig.maxItems : 6,
  };

  await Promise.all([
    writeFile(path.join(outputDir, 'tools.json'), JSON.stringify({ tools }, null, 2), 'utf8'),
    writeFile(path.join(outputDir, 'tutorials.json'), JSON.stringify({ tutorials }, null, 2), 'utf8'),
    writeFile(path.join(outputDir, 'categories.json'), JSON.stringify({ categories }, null, 2), 'utf8'),
    writeFile(path.join(outputDir, 'weekly-picks.json'), JSON.stringify({ weeklyPicks }, null, 2), 'utf8'),
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
      path.join(outputDir, 'weekly-picks.js'),
      `module.exports = ${JSON.stringify({ weeklyPicks }, null, 2)};\n`,
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
