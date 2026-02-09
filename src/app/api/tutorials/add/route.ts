import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TutorialsJson, TutorialData } from '@/types/tutorials';

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
    const raw = await fs.readFile(TUTORIALS_PATH, 'utf-8');
    const json = JSON.parse(raw) as TutorialsJson;
    const tutorials = json.tutorials || [];

    // 查重：按 URL
    if (tutorials.some((t) => t.url === payload.url)) {
      return NextResponse.json(
        { success: false, message: '该链接已经在教程列表中' },
        { status: 409 },
      );
    }

    // 自动分类：如果前端没传 category，则按标题/摘要匹配已有分类
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
        version: json.meta?.version || '1.0.0',
        updatedAt: new Date().toISOString(),
        count: (json.meta?.count || tutorials.length) + 1,
      },
    };

    await fs.writeFile(TUTORIALS_PATH, JSON.stringify(updated, null, 2), 'utf-8');

    return NextResponse.json({ success: true, data: newTutorial });
  } catch (error) {
    console.error('Add tutorial error:', error);
    return NextResponse.json(
      { success: false, message: '写入教程数据时发生错误' },
      { status: 500 },
    );
  }
}

