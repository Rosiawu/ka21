import { TutorialsJson } from '@/types/tutorials';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

export async function fetchJsonFileFromGitHub<T>(filePath: string): Promise<{ sha: string; content: T }> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env variables');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
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
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return {
    sha: data.sha,
    content: JSON.parse(content) as T,
  };
}

export async function updateGitHubJsonFile<T>(
  filePath: string,
  sha: string,
  newContent: T,
  message: string
) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env variables');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
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

const TUTORIALS_FILE_PATH = 'src/data/tutorials.json';

export async function fetchFromGitHub(): Promise<{ sha: string; content: TutorialsJson }> {
  return fetchJsonFileFromGitHub<TutorialsJson>(TUTORIALS_FILE_PATH);
}

export async function updateGitHubFile(sha: string, newContent: TutorialsJson, message: string) {
  return updateGitHubJsonFile(TUTORIALS_FILE_PATH, sha, newContent, message);
}
