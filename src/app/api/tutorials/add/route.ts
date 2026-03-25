import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { TutorialsJson, TutorialData } from '@/types/tutorials';
import { fetchFromGitHub, updateGitHubFile } from '@/lib/github';
import { getPrimaryCoreScenario, resolveTutorialCoreScenarios } from '@/lib/coreTaxonomy';
import { requireAdminAccess } from '@/lib/security/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { safeFetch } from '@/lib/security/safe-fetch';

type DifficultyLevel = '小白入门' | '萌新进阶' | '高端玩家';

interface AddTutorialPayload {
  url: string;
  title: string;
  author: string;
  publishDate: string;
  summary: string;
  cover?: string;
  category?: string;
  difficultyLevel?: DifficultyLevel;
  recommendReason?: string;
  skillTags?: string[];
}

interface TutorialsMeta {
  version?: string;
  updatedAt?: string;
  count?: number;
}

const TUTORIALS_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'tutorials.json',
);

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'tutorials');
const MAX_COVER_BYTES = 8 * 1024 * 1024;

const normalizeDate = (input: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const match = input.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

const generateId = (url: string, title: string, existing: TutorialData[]): string => {
  let host = '';
  try {
    const u = new URL(url);
    host = u.hostname.replace(/\./g, '-');
  } catch {
    host = 'custom';
  }

  const cleanTitle = title
    .replace(/\s+/g, '')
    .replace(/[^\u4e00-\u9fa5\w]+/g, '');

  const base = `tutorial-${host}-${cleanTitle.slice(0, 24) || 'article'}`;
  let index = 0;
  let candidate = `${base}-${index}`;
  const exists = (id: string) => existing.some((t) => t.id === id);

  while (exists(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
};

const inferExtension = (url: string, contentType?: string | null): string => {
  if (contentType) {
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('webp')) return '.webp';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  }
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return '.jpg';
  return '.jpg';
};

const downloadCoverToLocal = async (coverUrl: string, id: string): Promise<string | null> => {
  try {
    await fs.mkdir(IMAGE_DIR, { recursive: true });
    const res = await safeFetch(coverUrl, {
      cache: 'no-store',
    }, {
      timeoutMs: 12_000,
    });
    if (!res.ok || !res.body) return null;

    if (!res.headers.get('content-type')?.startsWith('image/')) {
      return null;
    }

    const declaredLength = Number(res.headers.get('content-length') || '0');
    if (declaredLength > MAX_COVER_BYTES) {
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_COVER_BYTES) {
      return null;
    }
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 10);
    const ext = inferExtension(coverUrl, res.headers.get('content-type'));
    const filename = `${id}-${hash}${ext}`;
    await fs.writeFile(path.join(IMAGE_DIR, filename), buffer);
    return `/images/tutorials/${filename}`;
  } catch {
    return null;
  }
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function POST(request: Request) {
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'tutorials-add',
    limit: 24,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let payload: AddTutorialPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: '请求体不是有效的 JSON' },
      { status: 400 },
    );
  }

  if (!payload.url || !payload.title) {
    return NextResponse.json(
      { success: false, message: 'url 和 title 为必填字段' },
      { status: 400 },
    );
  }

  let normalizedSourceUrl: string;
  try {
    const url = new URL(payload.url.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('invalid');
    }
    normalizedSourceUrl = url.toString();
  } catch {
    return NextResponse.json(
      { success: false, message: '教程链接必须是有效的 http(s) 地址' },
      { status: 400 },
    );
  }

  const normalizedTitle = payload.title.trim().slice(0, 120);
  const normalizedAuthor = (payload.author || '').trim().slice(0, 40);
  const normalizedSummary = (payload.summary || '').trim().slice(0, 500);
  const normalizedCover = (payload.cover || '').trim().slice(0, 1000);

  if (!normalizedTitle) {
    return NextResponse.json(
      { success: false, message: 'title 不能为空' },
      { status: 400 },
    );
  }

  try {
    let tutorials: TutorialData[] = [];
    let meta: TutorialsMeta = {};
    let sha = '';

    const useGitHub = !!(GITHUB_TOKEN && GITHUB_REPO);

    if (useGitHub) {
      try {
        const ghData = await fetchFromGitHub();
        tutorials = ghData.content.tutorials || [];
        meta = (ghData.content.meta as TutorialsMeta) || {};
        sha = ghData.sha;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json(
          { success: false, message: `无法从 GitHub 获取数据: ${msg}` },
          { status: 500 },
        );
      }
    } else {
      const raw = await fs.readFile(TUTORIALS_PATH, 'utf-8');
      const json = JSON.parse(raw) as TutorialsJson;
      tutorials = json.tutorials || [];
      meta = (json.meta as TutorialsMeta) || {};
    }

    if (tutorials.some((t) => t.url === normalizedSourceUrl)) {
      return NextResponse.json(
        { success: false, message: '该链接已经在教程列表中' },
        { status: 409 },
      );
    }

    let category = payload.category;
    if (!category) {
      const categories = Array.from(
        new Set(tutorials.map((t) => t.category).filter(Boolean)),
      );
      const combined = `${normalizedTitle} ${normalizedSummary}`;
      const matched =
        categories.find((c) => c && combined.includes(c)) || categories[0] || 'AI效率';
      category = matched;
    }

    category = getPrimaryCoreScenario(
      resolveTutorialCoreScenarios({
        category,
        skillTags: payload.skillTags || [],
      })
    );

    const difficulty: DifficultyLevel =
      payload.difficultyLevel || '萌新进阶';

    const skillTags = Array.isArray(payload.skillTags)
      ? payload.skillTags
      : [];

    const id = generateId(normalizedSourceUrl, normalizedTitle, tutorials);

    let customImageUrl: string | null = null;
    if (normalizedCover) {
      if (normalizedCover.startsWith('http') && !useGitHub) {
        customImageUrl = await downloadCoverToLocal(normalizedCover, id);
      } else {
        customImageUrl = normalizedCover;
      }
    }

    const newTutorial: TutorialData = {
      id,
      title: normalizedTitle,
      description: normalizedSummary || normalizedTitle,
      url: normalizedSourceUrl,
      source: normalizedAuthor || '未知作者',
      publishDate: normalizeDate(payload.publishDate || ''),
      difficultyLevel: difficulty,
      category,
      skillTags,
      recommendReason: (payload.recommendReason || normalizedSummary || '').trim().slice(0, 500),
      customImageUrl,
      relatedTools: [],
    };

    const updated: TutorialsJson = {
      tutorials: [...tutorials, newTutorial],
      meta: {
        version: meta.version || '1.0.0',
        updatedAt: new Date().toISOString(),
        count: (meta.count || tutorials.length) + 1,
      },
    };

    if (useGitHub) {
      await updateGitHubFile(
        sha,
        updated,
        `feat(content): add new tutorial "${payload.title}" via web form`
      );
    } else {
      await fs.writeFile(TUTORIALS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    }

    return NextResponse.json({
      success: true,
      data: newTutorial,
      message: useGitHub ? '已提交到 GitHub，请等待 Vercel 自动构建（约 1-2 分钟）' : '已保存到本地文件'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '写入教程数据时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}
