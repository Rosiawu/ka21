import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TutorialsJson, TutorialData } from '@/types/tutorials';

// 动态引入 node-fetch 避免构建问题
const fetch = globalThis.fetch;

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

const TUTORIALS_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'tutorials.json',
);

const normalizeDate = (input: string): string => {
  // 已经是 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // 微信常见格式：YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss
  const match = input.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  // 兜底：今天
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

// GitHub API 配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "Rosiawu/ka21"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = 'src/data/tutorials.json';

/**
 * 从 GitHub 获取最新的 tutorials.json 内容
 */
async function fetchFromGitHub() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env variables');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as any;
  // GitHub 返回的是 base64 编码的内容
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return {
    sha: data.sha, // 更新文件时需要提供 sha
    content: JSON.parse(content) as TutorialsJson,
  };
}

/**
 * 更新 GitHub 上的文件
 */
async function updateGitHubFile(sha: string, newContent: TutorialsJson, message: string) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env variables');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'),
    sha,
    branch: GITHUB_BRANCH,
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json() as any;
    throw new Error(`GitHub Update Error: ${err.message}`);
  }

  return await res.json();
}

export async function POST(request: Request) {
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

  try {
    let tutorials: TutorialData[] = [];
    let meta: any = {};
    let sha = '';
    
    // 判断环境：如果有 GitHub Token，则走 GitHub API 流程（生产环境）
    // 否则走本地文件系统流程（开发环境）
    const useGitHub = !!(GITHUB_TOKEN && GITHUB_REPO);

    if (useGitHub) {
      console.log('Using GitHub API to update tutorials...');
      try {
        const ghData = await fetchFromGitHub();
        tutorials = ghData.content.tutorials || [];
        meta = ghData.content.meta || {};
        sha = ghData.sha;
      } catch (e: any) {
        console.error('Failed to fetch from GitHub:', e);
        return NextResponse.json(
          { success: false, message: `无法从 GitHub 获取数据: ${e.message}` },
          { status: 500 },
        );
      }
    } else {
      console.log('Using local file system to update tutorials...');
      // 本地开发环境读取本地文件
      const raw = await fs.readFile(TUTORIALS_PATH, 'utf-8');
      const json = JSON.parse(raw) as TutorialsJson;
      tutorials = json.tutorials || [];
      meta = json.meta || {};
    }

    // 查重：按 URL
    if (tutorials.some((t) => t.url === payload.url)) {
      return NextResponse.json(
        { success: false, message: '该链接已经在教程列表中' },
        { status: 409 },
      );
    }

    // 自动分类
    let category = payload.category;
    if (!category) {
      const categories = Array.from(
        new Set(tutorials.map((t) => t.category).filter(Boolean)),
      );
      const text = `${payload.title} ${payload.summary || ''}`;
      const matched =
        categories.find((c) => c && text.includes(c)) || categories[0] || 'AI效率';
      category = matched;
    }

    const difficulty: DifficultyLevel =
      payload.difficultyLevel || '萌新进阶';

    const skillTags = Array.isArray(payload.skillTags)
      ? payload.skillTags
      : [];

    const newTutorial: TutorialData = {
      id: generateId(payload.url, payload.title, tutorials),
      title: payload.title,
      description: payload.summary || payload.title,
      url: payload.url,
      source: payload.author || '未知作者',
      publishDate: normalizeDate(payload.publishDate || ''),
      difficultyLevel: difficulty,
      category,
      skillTags,
      recommendReason: payload.recommendReason || payload.summary || '',
      customImageUrl: payload.cover || null,
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
      // 提交到 GitHub
      await updateGitHubFile(
        sha, 
        updated, 
        `feat(content): add new tutorial "${payload.title}" via web form`
      );
      console.log('Successfully updated via GitHub API');
    } else {
      // 写入本地文件
      await fs.writeFile(TUTORIALS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
      console.log('Successfully updated local file');
    }

    return NextResponse.json({ 
      success: true, 
      data: newTutorial,
      message: useGitHub ? '已提交到 GitHub，请等待 Vercel 自动构建（约 1-2 分钟）' : '已保存到本地文件'
    });
  } catch (error) {
    console.error('Add tutorial error:', error);
    return NextResponse.json(
      { success: false, message: '写入教程数据时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}

