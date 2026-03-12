import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

import toolsData from '@/data/tools.json';
import tutorialsData from '@/data/tutorials.json';
import weeklyPicksData from '@/data/weekly-picks.json';
import { TOOL_CATEGORIES } from '@/data/toolCategories';
import { teamMembers } from '@/data/team-members';
import { sortedDevLogs } from '@/data/devLogs';

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

const ASSET_BASE_URL = 'https://ka21.tools';
const TUTORIAL_CATEGORY_LABEL_MAP: Record<string, string> = {
  'office-productivity': 'AI办公',
};
const MINIAPP_CATEGORY_ICONS: Record<string, string> = {
  writing: '/icons/categories/pen.svg',
  image: '/icons/categories/palette.svg',
  video: '/icons/categories/chart.svg',
  audio: '/icons/categories/headset.svg',
  office: '/icons/categories/briefcase.svg',
  coding: '/icons/categories/chip.svg',
  utils: '/icons/categories/settings.svg',
};

function toAbsoluteAssetUrl(rawPath: string | undefined): string {
  if (!rawPath || typeof rawPath !== 'string') return '';
  if (/^https?:\/\//.test(rawPath)) return rawPath;
  if (rawPath.startsWith('/')) return `${ASSET_BASE_URL}${rawPath}`;
  return `${ASSET_BASE_URL}/${rawPath.replace(/^\/+/, '')}`;
}

function normalizeTools() {
  const records = ((toolsData as { tools?: ToolRecord[] }).tools || []) as ToolRecord[];
  return records
    .filter((tool) => tool.isVisible !== false)
    .map((tool) => ({
      ...tool,
      icon: toAbsoluteAssetUrl(tool.icons?.svg || tool.icons?.png || tool.icon || ''),
      tags: Array.isArray(tool.tags) ? tool.tags : [],
      guides: Array.isArray(tool.guides) ? tool.guides : [],
      relatedTutorials: Array.isArray(tool.relatedTutorials) ? tool.relatedTutorials : [],
      groupComments: Array.isArray(tool.groupComments) ? tool.groupComments : [],
    }))
    .sort((a, b) => {
      const categoryCompare = (a.toolCategory || '').localeCompare(b.toolCategory || '');
      if (categoryCompare !== 0) return categoryCompare;
      return (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999);
    });
}

function normalizeTutorials() {
  const records = ((tutorialsData as { tutorials?: TutorialRecord[] }).tutorials || []) as TutorialRecord[];
  return records
    .map((tutorial) => {
      const normalizedCategory =
        TUTORIAL_CATEGORY_LABEL_MAP[tutorial.category || ''] || (tutorial.category || '');
      return {
        ...tutorial,
        author: tutorial.source || '',
        imageUrl: toAbsoluteAssetUrl(tutorial.customImageUrl || ''),
        category: normalizedCategory,
        skillTags: Array.isArray(tutorial.skillTags) ? tutorial.skillTags : [],
        relatedTools: Array.isArray(tutorial.relatedTools) ? tutorial.relatedTools : [],
      };
    })
    .sort((a, b) => new Date(b.publishDate || '').getTime() - new Date(a.publishDate || '').getTime());
}

function normalizeCategories() {
  return TOOL_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description || '',
    icon: toAbsoluteAssetUrl(
      MINIAPP_CATEGORY_ICONS[category.id] || category.icon || '/icons/categories/briefcase.svg',
    ),
  }));
}

function normalizeTeamMembers() {
  return teamMembers.map((member) => ({
    id: member.id,
    name: member.name,
    title: member.title,
    avatar: toAbsoluteAssetUrl(member.avatar),
    location: member.location,
    specialty: member.specialty,
    nickname: member.nickname,
    wechatQR: toAbsoluteAssetUrl(member.wechatQR),
    wechatAccount: member.wechatAccount,
    aiTools: Array.isArray(member.aiTools) ? member.aiTools : [],
    description: member.description || '',
    skills: Array.isArray(member.skills) ? member.skills : [],
    projectHighlights: Array.isArray(member.projectHighlights) ? member.projectHighlights : [],
    personalTraits: Array.isArray(member.personalTraits) ? member.personalTraits : [],
  }));
}

function normalizeWeeklyPicks() {
  const config = (weeklyPicksData || {}) as { toolIds?: string[]; maxItems?: number };
  return {
    toolIds: Array.isArray(config.toolIds) ? config.toolIds : [],
    maxItems: typeof config.maxItems === 'number' ? config.maxItems : 6,
  };
}

function normalizeDevLogs() {
  return sortedDevLogs.slice(0, 12).map((log) => ({
    id: log.id,
    version: log.version,
    date: log.date,
    title: log.cardTitle.zh,
    snippet: log.body.zh.split('\n').map((line) => line.trim()).find(Boolean) || '',
    imageUrl: toAbsoluteAssetUrl(log.images?.[0]?.src || ''),
  }));
}

function buildPayload() {
  return {
    tools: normalizeTools(),
    tutorials: normalizeTutorials(),
    categories: normalizeCategories(),
    teamMembers: normalizeTeamMembers(),
    weeklyPicks: normalizeWeeklyPicks(),
    devLogs: normalizeDevLogs(),
  };
}

function buildVersion(payload: ReturnType<typeof buildPayload>): string {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

export async function GET() {
  const payload = buildPayload();
  const version = buildVersion(payload);

  return NextResponse.json(
    {
      success: true,
      data: {
        version,
        generatedAt: new Date().toISOString(),
        ...payload,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
