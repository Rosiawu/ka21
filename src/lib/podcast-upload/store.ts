import fs from 'fs/promises';
import path from 'path';
import { fetchJsonFileFromGitHub, updateGitHubJsonFile } from '@/lib/github';

export type PodcastUploadInput = {
  title: string;
  subtitle?: string;
  slug?: string;
  pubDate?: string;
  episodeNumber?: string;
  season?: string;
  explicit?: boolean;
  shownotes: string;
  audio: {
    fileName: string;
    mimeType: string;
    bytes: number;
    base64: string;
  };
  cover: {
    fileName: string;
    mimeType: string;
    bytes: number;
    base64: string;
  };
};

export type PodcastUploadEpisode = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  pubDate: string;
  episodeNumber: string;
  season: string;
  explicit: boolean;
  shownotes: string;
  description: string;
  audioPath: string;
  coverPath: string;
  pagePath: string;
  audioUrl: string;
  coverUrl: string;
  pageUrl: string;
  audioBytes: number;
  audioMimeType: string;
  createdAt: string;
};

type PodcastUploadStore = {
  episodes: PodcastUploadEpisode[];
  meta: {
    updatedAt: string;
    count: number;
  };
};

const STORE_LOCAL_PATH = path.join(process.cwd(), 'src', 'data', 'podcast-upload-submissions.json');
const STORE_GITHUB_PATH = 'src/data/podcast-upload-submissions.json';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const FEED_DIR = 'podcast-feed';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const MAX_WRITE_ATTEMPTS = 4;

function isGitHubBackedStore() {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO);
}

function nowIso() {
  return new Date().toISOString();
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://ka21.org').replace(/\/+$/, '');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
  return slug || `episode-${Date.now().toString(36)}`;
}

function extensionFromFile(fileName: string, mimeType: string, fallback: string) {
  const ext = path.extname(fileName || '').replace(/^\./, '').toLowerCase();
  if (ext) return ext;
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return fallback;
}

function plainDescription(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, '')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_`>#-]+/g, '')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')
    .slice(0, 900);
}

function markdownToHtml(markdown: string) {
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const renderInline = (value: string) =>
    escapeXml(value)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
    } else if (bullet) {
      flushParagraph();
      listItems.push(bullet[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();
  return blocks.join('\n');
}

function formatPubDate(rawDate?: string) {
  if (!rawDate) return new Date().toUTCString();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T09:00:00+08:00`)
    : new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return new Date().toUTCString();
  }
  return date.toUTCString();
}

async function readLocalStore(): Promise<PodcastUploadStore> {
  try {
    const raw = await fs.readFile(STORE_LOCAL_PATH, 'utf-8');
    return JSON.parse(raw) as PodcastUploadStore;
  } catch {
    return { episodes: [], meta: { updatedAt: '', count: 0 } };
  }
}

async function writeLocalStore(data: PodcastUploadStore) {
  await fs.mkdir(path.dirname(STORE_LOCAL_PATH), { recursive: true });
  await fs.writeFile(STORE_LOCAL_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function readStore(): Promise<{ data: PodcastUploadStore; sha?: string }> {
  if (isGitHubBackedStore()) {
    const result = await fetchJsonFileFromGitHub<PodcastUploadStore>(STORE_GITHUB_PATH);
    return { data: result.content, sha: result.sha };
  }
  return { data: await readLocalStore() };
}

async function writeStore(data: PodcastUploadStore, message: string, sha?: string) {
  data.meta.updatedAt = nowIso();
  data.meta.count = data.episodes.length;
  if (isGitHubBackedStore()) {
    if (!sha) throw new Error('missing-store-sha');
    await updateGitHubJsonFile(STORE_GITHUB_PATH, sha, data, message);
    return;
  }
  await writeLocalStore(data);
}

async function fetchGitHubFileSha(filePath: string) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) throw new Error('missing-github-config');
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodedPath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) return undefined;
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message || `github-sha-fetch-failed-${res.status}`);
  }

  const data = (await res.json()) as { sha?: string };
  return data.sha;
}

function isGitHubWriteConflict(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('409') || message.includes('sha') || message.includes('conflict');
}

async function writePublicFile(relativePath: string, contentBase64: string, message: string) {
  if (isGitHubBackedStore()) {
    if (!GITHUB_TOKEN || !GITHUB_REPO) throw new Error('missing-github-config');
    const githubPath = `public/${relativePath}`;
    const encodedPath = githubPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodedPath}`;

    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const sha = await fetchGitHubFileSha(githubPath);
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: contentBase64,
          branch: GITHUB_BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });

      if (res.ok) return;

      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      const writeError = new Error(err?.message || `github-write-failed-${res.status}`);
      if (!isGitHubWriteConflict(writeError) || attempt === MAX_WRITE_ATTEMPTS - 1) {
        throw writeError;
      }
    }
    return;
  }

  const absolutePath = path.join(PUBLIC_DIR, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(contentBase64, 'base64'));
}

function buildEpisodePage(episode: PodcastUploadEpisode) {
  const bodyHtml = markdownToHtml(episode.shownotes);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeXml(episode.title)}</title>
  <style>
    body{max-width:760px;margin:48px auto;padding:0 20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;line-height:1.7;color:#171717;background:#fbfaf7}
    img{max-width:300px;width:100%;height:auto;display:block;margin-bottom:24px;border:1px solid #d9dce3}
    audio{width:100%;margin:16px 0 28px}
    a{color:#1457ff}
  </style>
</head>
<body>
  <img src="${escapeXml(episode.coverUrl)}" alt="">
  <h1>${escapeXml(episode.title)}</h1>
  <audio controls src="${escapeXml(episode.audioUrl)}"></audio>
  ${bodyHtml}
</body>
</html>
`;
}

function buildFeed(episodes: PodcastUploadEpisode[]) {
  const siteUrl = getSiteUrl();
  const feedUrl = `${siteUrl}/${FEED_DIR}/feed.xml`;
  const latestCover = episodes[0]?.coverUrl || `${siteUrl}/images/podcast/dengxiabai-logo-official.png`;
  const items = episodes
    .map((episode) => {
      const shownotesHtml = markdownToHtml(episode.shownotes);
      return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <link>${escapeXml(episode.pageUrl)}</link>
      <guid isPermaLink="false">${escapeXml(episode.id)}</guid>
      <pubDate>${escapeXml(episode.pubDate)}</pubDate>
      <description>${escapeXml(episode.description)}</description>
      <content:encoded>${escapeXml(shownotesHtml)}</content:encoded>
      <itunes:summary>${escapeXml(episode.description)}</itunes:summary>
      ${episode.subtitle ? `<itunes:subtitle>${escapeXml(episode.subtitle)}</itunes:subtitle>` : ''}
      <itunes:author>吴熳</itunes:author>
      <itunes:explicit>${episode.explicit ? 'yes' : 'no'}</itunes:explicit>
      ${episode.episodeNumber ? `<itunes:episode>${escapeXml(episode.episodeNumber)}</itunes:episode>` : ''}
      ${episode.season ? `<itunes:season>${escapeXml(episode.season)}</itunes:season>` : ''}
      <enclosure url="${escapeXml(episode.audioUrl)}" length="${episode.audioBytes}" type="${escapeXml(episode.audioMimeType)}" />
      <itunes:image href="${escapeXml(episode.coverUrl)}" />
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <title>灯下白播客</title>
    <link>${escapeXml(siteUrl)}/podcast</link>
    <description>灯下白播客，和真正做 AI 的人聊真实经验。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:summary>灯下白播客，和真正做 AI 的人聊真实经验。</itunes:summary>
    <itunes:subtitle>真人真聊真AI</itunes:subtitle>
    <itunes:author>吴熳</itunes:author>
    <itunes:explicit>no</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:category text="Technology" />
    <itunes:owner>
      <itunes:name>吴熳</itunes:name>
      <itunes:email>hello@ka21.org</itunes:email>
    </itunes:owner>
    <image>
      <url>${escapeXml(latestCover)}</url>
      <title>灯下白播客</title>
      <link>${escapeXml(siteUrl)}/podcast</link>
    </image>
    <itunes:image href="${escapeXml(latestCover)}" />
${items}
  </channel>
</rss>
`;
}

function buildEpisode(input: PodcastUploadInput, existingEpisodes: PodcastUploadEpisode[]) {
  const title = input.title.trim().slice(0, 120);
  if (!title) throw new Error('missing-title');
  if (!input.shownotes.trim()) throw new Error('missing-shownotes');
  if (!input.audio.bytes) throw new Error('missing-audio');
  if (!input.cover.bytes) throw new Error('missing-cover');

  const baseSlug = slugify(input.slug || title);
  const existingSlugs = new Set(existingEpisodes.map((episode) => episode.slug));
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const siteUrl = getSiteUrl();
  const audioExt = extensionFromFile(input.audio.fileName, input.audio.mimeType, 'mp3');
  const coverExt = extensionFromFile(input.cover.fileName, input.cover.mimeType, 'jpg');
  const episodeDir = `${FEED_DIR}/episodes/${slug}`;
  const audioPath = `${episodeDir}/audio.${audioExt}`;
  const coverPath = `${episodeDir}/cover.${coverExt}`;
  const pagePath = `${episodeDir}/index.html`;
  const pubDate = formatPubDate(input.pubDate);

  return {
    id: `${siteUrl}/${pagePath}`,
    slug,
    title,
    subtitle: (input.subtitle || '').trim().slice(0, 160),
    pubDate,
    episodeNumber: (input.episodeNumber || '').trim().slice(0, 20),
    season: (input.season || '').trim().slice(0, 20),
    explicit: Boolean(input.explicit),
    shownotes: input.shownotes.trim().slice(0, 30_000),
    description: plainDescription(input.shownotes || title) || title,
    audioPath,
    coverPath,
    pagePath,
    audioUrl: `${siteUrl}/${audioPath}`,
    coverUrl: `${siteUrl}/${coverPath}`,
    pageUrl: `${siteUrl}/${pagePath}`,
    audioBytes: input.audio.bytes,
    audioMimeType: input.audio.mimeType || 'audio/mpeg',
    createdAt: nowIso(),
  } satisfies PodcastUploadEpisode;
}

export async function submitPodcastEpisode(input: PodcastUploadInput) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { data, sha } = await readStore();
    const episode = buildEpisode(input, data.episodes || []);
    const nextEpisodes = [episode, ...(data.episodes || [])];
    const nextStore: PodcastUploadStore = {
      episodes: nextEpisodes,
      meta: {
        updatedAt: nowIso(),
        count: nextEpisodes.length,
      },
    };

    try {
      await writePublicFile(episode.audioPath, input.audio.base64, `feat(podcast): upload audio ${episode.slug}`);
      await writePublicFile(episode.coverPath, input.cover.base64, `feat(podcast): upload cover ${episode.slug}`);
      await writePublicFile(
        `${FEED_DIR}/episodes/${episode.slug}/shownotes.md`,
        Buffer.from(episode.shownotes, 'utf-8').toString('base64'),
        `feat(podcast): upload shownotes ${episode.slug}`,
      );
      await writePublicFile(
        episode.pagePath,
        Buffer.from(buildEpisodePage(episode), 'utf-8').toString('base64'),
        `feat(podcast): publish page ${episode.slug}`,
      );
      await writePublicFile(
        `${FEED_DIR}/feed.xml`,
        Buffer.from(buildFeed(nextEpisodes), 'utf-8').toString('base64'),
        `feat(podcast): rebuild feed for ${episode.slug}`,
      );
      await writeStore(nextStore, `feat(podcast): submit ${episode.slug}`, sha);
      return {
        episode,
        feedUrl: `${getSiteUrl()}/${FEED_DIR}/feed.xml`,
        store: nextStore,
      };
    } catch (error) {
      lastError = error;
      if (!isGitHubBackedStore() || !isGitHubWriteConflict(error) || attempt === MAX_WRITE_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('podcast-submit-failed');
}
