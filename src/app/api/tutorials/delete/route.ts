import { NextResponse } from 'next/server';
import { fetchFromGitHub, updateGitHubFile } from '@/lib/github';
import fs from 'fs/promises';
import path from 'path';
import type { TutorialsJson } from '@/types/tutorials';

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
    let tutorials: any[] = [];
    let meta: any = {};
    let sha = '';

    if (useGitHub) {
      try {
        const ghData = await fetchFromGitHub();
        tutorials = ghData.content.tutorials || [];
        meta = ghData.content.meta || {};
        sha = ghData.sha;
      } catch (e: any) {
        return NextResponse.json(
          { success: false, message: `无法从 GitHub 获取数据: ${e.message}` },
          { status: 500 },
        );
      }
    } else {
      // 本地开发环境读取本地文件
      try {
        const raw = await fs.readFile(TUTORIALS_PATH, 'utf-8');
        const json = JSON.parse(raw) as TutorialsJson;
        tutorials = json.tutorials || [];
        meta = json.meta || {};
      } catch (e) {
        // 如果文件不存在或解析失败
        console.error('Local file read error:', e);
      }
    }

    // 查找并删除
    const initialLength = tutorials.length;
    const newTutorials = tutorials.filter(t => t.id !== id);
    
    if (newTutorials.length === initialLength) {
      return NextResponse.json({ success: false, message: '找不到该教程 ID' }, { status: 404 });
    }

    const deletedTutorial = tutorials.find(t => t.id === id);

    const updatedData: TutorialsJson = {
      tutorials: newTutorials,
      meta: {
        ...meta,
        updatedAt: new Date().toISOString(),
        count: newTutorials.length
      }
    };

    if (useGitHub) {
      await updateGitHubFile(sha, updatedData, `feat(content): delete tutorial "${deletedTutorial?.title || id}"`);
      console.log('Successfully deleted via GitHub API');
    } else {
      await fs.writeFile(TUTORIALS_PATH, JSON.stringify(updatedData, null, 2), 'utf-8');
      console.log('Successfully deleted from local file');
    }

    return NextResponse.json({ 
      success: true, 
      message: useGitHub ? '已从 GitHub 删除，请等待重新部署' : '已从本地删除' 
    });

  } catch (error) {
    console.error('Delete tutorial error:', error);
    return NextResponse.json(
      { success: false, message: '删除教程时发生错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}
