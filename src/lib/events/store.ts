import fs from 'fs/promises';
import path from 'path';
import { fetchJsonFileFromGitHub, updateGitHubJsonFile } from '@/lib/github';
import type { EventEntry } from '@/data/events';

type EventSubmissionFile = {
  entries: EventEntry[];
  meta: {
    version: string;
    updatedAt: string;
    count: number;
  };
};

const SUBMISSIONS_PATH = path.join(process.cwd(), 'src', 'data', 'event-submissions.json');
const SUBMISSIONS_GITHUB_PATH = 'src/data/event-submissions.json';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

function isGitHubBackedStore() {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO);
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('invalid-image-data-url');
  }
  const mimeType = match[1];
  const base64 = match[2];
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  return { base64, ext };
}

async function readLocalStore() {
  const raw = await fs.readFile(SUBMISSIONS_PATH, 'utf-8');
  return JSON.parse(raw) as EventSubmissionFile;
}

async function writeLocalStore(data: EventSubmissionFile) {
  await fs.writeFile(SUBMISSIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function readStore(): Promise<{ data: EventSubmissionFile; sha?: string }> {
  if (isGitHubBackedStore()) {
    const result = await fetchJsonFileFromGitHub<EventSubmissionFile>(SUBMISSIONS_GITHUB_PATH);
    return { data: result.content, sha: result.sha };
  }
  return { data: await readLocalStore() };
}

async function writeStore(data: EventSubmissionFile, message: string, sha?: string) {
  data.meta.updatedAt = nowIso();
  data.meta.count = data.entries.length;
  if (isGitHubBackedStore()) {
    if (!sha) throw new Error('missing-sha');
    await updateGitHubJsonFile(SUBMISSIONS_GITHUB_PATH, sha, data, message);
    return;
  }
  await writeLocalStore(data);
}

async function uploadImageToGitHub(filePath: string, base64: string, message: string) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env variables');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: base64,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(err?.message || `GitHub image upload error: ${res.status}`);
  }
}

async function uploadImageLocally(relativeFilePath: string, base64: string) {
  const absolutePath = path.join(PUBLIC_DIR, relativeFilePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(base64, 'base64'));
}

async function persistImages(images: string[], entryId: string, title: string) {
  const imageDir = `images/events/submissions/${entryId}`;
  return Promise.all(
    images.slice(0, 6).map(async (image, index) => {
      const { base64, ext } = parseDataUrl(image);
      const fileName = `${String(index + 1).padStart(2, '0')}-${slugify(title) || 'event'}.${ext}`;
      const relativeFilePath = `${imageDir}/${fileName}`;
      if (isGitHubBackedStore()) {
        await uploadImageToGitHub(`public/${relativeFilePath}`, base64, `feat(events): upload image for ${entryId}`);
      } else {
        await uploadImageLocally(relativeFilePath, base64);
      }
      return `/${relativeFilePath}`;
    })
  );
}

export async function submitEvent(input: {
  title: string;
  summary: string;
  sourceUrl: string;
  organizer?: string;
  author?: string;
  eventDate?: string;
  deadline?: string;
  location?: string;
  sourceLabel?: string;
  tags?: string[];
  images?: string[];
}) {
  const title = input.title.trim().slice(0, 80);
  const summary = input.summary.trim().slice(0, 1200);
  const sourceUrl = input.sourceUrl.trim().slice(0, 500);
  const organizer = (input.organizer || '').trim().slice(0, 40);
  const author = (input.author || '').trim().slice(0, 20);
  const eventDate = (input.eventDate || '').trim().slice(0, 20);
  const deadline = (input.deadline || '').trim().slice(0, 20);
  const location = (input.location || '').trim().slice(0, 40);
  const sourceLabel = (input.sourceLabel || '').trim().slice(0, 30);
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
    : [];

  if (!title) throw new Error('missing-title');
  if (!summary) throw new Error('missing-summary');
  if (!sourceUrl) throw new Error('missing-source-url');

  const { data, sha } = await readStore();
  const createdAt = nowIso();
  const entryId = `${slugify(title) || 'event'}-${Date.now()}`;
  const imagePaths = await persistImages(input.images || [], entryId, title);

  const entry: EventEntry = {
    id: entryId,
    title,
    summary,
    organizer,
    author,
    sourceUrl,
    sourceLabel: sourceLabel || '外部帖子',
    eventDate,
    deadline,
    location,
    tags,
    coverImage: imagePaths[0],
    images: imagePaths,
    createdAt,
  };

  data.entries.unshift(entry);
  await writeStore(data, `feat(events): submit ${entryId}`, sha);
  return entry;
}
