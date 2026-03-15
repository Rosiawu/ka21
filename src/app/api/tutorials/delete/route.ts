import { NextResponse } from 'next/server';
import { fetchFromGitHub, updateGitHubFile } from '@/lib/github';
import fs from 'fs/promises';
import path from 'path';
import type { TutorialData, TutorialsJson, TutorialsMeta } from '@/types/tutorials';

const TUTORIALS_PATH = path.join(process.cwd(), 'src', 'data', 'tutorials.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    }

    const useGitHub = !!(GITHUB_TOKEN && GITHUB_REPO);
    let tutorials: TutorialData[] = [];
    let meta: Partial<TutorialsMeta> = {};
    let sha = '';

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
      try {
        const raw = await fs.readFile(TUTORIALS_PATH, 'utf-8');
        const json = JSON.parse(raw) as TutorialsJson;
        tutorials = json.tutorials || [];
        meta = (json.meta as TutorialsMeta) || {};
      } catch {
        // file missing or parse error — treat as empty
      }
    }

    const initialLength = tutorials.length;
    const newTutorials = tutorials.filter(t => t.id !== id);

    if (newTutorials.length === initialLength) {
      return NextResponse.json({ success: false, message: '找不到该教程 ID' }, { status: 404 });
    }

    const deletedTutorial = tutorials.find(t => t.id === id);

    const updatedData: TutorialsJson = {
      tutorials: newTutorials as TutorialsJson['tutorials'],
      meta: {
        ...meta,
        version: meta.version || '1.0.0',
        updatedAt: new Date().toISOString(),
        count: newTutorials.length
      }
    };

    if (useGitHub) {
      await updateGitHubFile(sha, updatedData, `feat(content): delete tutorial "${deletedTutorial?.title || id}"`);
    } else {
      await fs.writeFile(TUTORIALS_PATH, JSON.stringify(updatedData, null, 2), 'utf-8');
    }

    return NextResponse.json({
      success: true,
      message: useGitHub ? '已从 GitHub 删除，请等待重新部署' : '已从本地删除'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: '删除教程时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}
