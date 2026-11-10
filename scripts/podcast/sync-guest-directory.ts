import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type PodcastConfig = {
  rssUrl: string;
};

type ShowNoteBlock = {
  type: 'paragraph' | 'heading' | 'timestamp';
  text: string;
  time?: string;
};

type DirectoryEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  guestLabel: string;
  publishedAt: string;
  duration: string;
  xiaoyuzhouUrl: string;
  coverUrl: string;
  audioUrl: string;
  guestBio: string;
  showNotes: ShowNoteBlock[];
};

const rootDir = process.cwd();
const configPath = path.join(rootDir, 'data', 'podcast-dashboard', 'config.json');
const outputPath = path.join(rootDir, 'src', 'data', 'podcast-episodes.json');

function normalizeInlineText(value: string) {
  return value
    .replace(/\u200b/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function nodeText($node: cheerio.Cheerio<AnyNode>) {
  const clone = $node.clone();
  clone.find('br').replaceWith('\n');
  return normalizeInlineText(clone.text());
}

function blockType(text: string, hasTimestamp: boolean): ShowNoteBlock['type'] {
  if (hasTimestamp || /^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?)?/.test(text)) {
    return 'timestamp';
  }

  if (
    /^(?:🪝|💡|🔥|⏱|📖|💬|🎙|本期故事|本期你会听到|本期金句|Shownotes|故事摘要|听众互动)/i.test(text)
  ) {
    return 'heading';
  }

  return 'paragraph';
}

function extractBlocks(html: string): ShowNoteBlock[] {
  const $ = cheerio.load(html);
  const blocks: ShowNoteBlock[] = [];

  $('p, h1, h2, h3, h4, li').each((_index, element) => {
    const node = $(element);
    const text = nodeText(node);
    if (!text) return;

    const timestamp = node.find('a.timestamp').first().text().trim();
    const type = blockType(text, Boolean(timestamp));
    blocks.push({
      type,
      text,
      ...(timestamp ? { time: timestamp } : {}),
    });
  });

  return blocks;
}

function extractEpisodeNumber(title: string) {
  const match = title.match(/^\s*(\d+)\s*\./);
  return match ? Number(match[1]) : 0;
}

function extractGuestLabel(title: string) {
  return title
    .replace(/^\s*\d+\s*\.\s*/, '')
    .split(/[：:]/)[0]
    .trim();
}

function cleanGuestBio(text: string) {
  const withoutLabel = text.replace(/^.*?(?:嘉宾|本期嘉宾)[｜|：:]\s*/u, '');
  return withoutLabel.split(/\s*(?:主持人|主播)\s*[｜|：:]\s*/u)[0].trim();
}

function extractGuestBio(blocks: ShowNoteBlock[], guestLabel: string) {
  const candidateIndex = blocks
    .slice(0, 10)
    .findIndex((block) => /(?:嘉宾|本期嘉宾)[｜|：:]/u.test(block.text));

  if (candidateIndex >= 0) {
    const collected: string[] = [];
    for (let index = candidateIndex; index < Math.min(blocks.length, candidateIndex + 5); index += 1) {
      const text = blocks[index].text;
      if (index > candidateIndex && /(?:主持人\s*[｜|：:]|主播\s*[｜|：:]|本节目由|🪝|💡|🔥|⏱|📖|💬)/u.test(text)) {
        break;
      }
      const cleaned = index === candidateIndex ? cleanGuestBio(text) : text.trim();
      if (cleaned) collected.push(cleaned);
      if (collected.join(' ').length >= 600) break;
    }

    const bio = collected.join(' ').trim();
    if (bio.length >= 12) return bio;
  }

  const fallback = blocks
    .slice(0, 8)
    .map((block) => block.text)
    .find((text) => text.includes(guestLabel) && text.length >= 12);

  return fallback || guestLabel;
}

async function fetchXml(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'user-agent': 'ka21-podcast-guest-directory/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`RSS request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  const config = JSON.parse(await readFile(configPath, 'utf8')) as PodcastConfig;
  const xml = await fetchXml(config.rssUrl);
  const $ = cheerio.load(xml, { xmlMode: true });

  const episodes = $('channel > item')
    .toArray()
    .map((item): DirectoryEpisode => {
      const node = $(item);
      const title = node.find('title').first().text().trim();
      const id = node.find('guid').first().text().trim();
      const content =
        node.find('content\\:encoded').first().text().trim() ||
        node.find('description').first().text().trim();
      const showNotes = extractBlocks(content);
      const guestLabel = extractGuestLabel(title);
      const publishedAt = new Date(node.find('pubDate').first().text().trim()).toISOString();

      return {
        id,
        episodeNumber: extractEpisodeNumber(title),
        title,
        guestLabel,
        publishedAt,
        duration: node.find('itunes\\:duration').first().text().trim(),
        xiaoyuzhouUrl:
          node.find('link').first().text().trim() ||
          `https://www.xiaoyuzhoufm.com/episode/${id}`,
        coverUrl:
          node.find('itunes\\:image').first().attr('href') ||
          cheerio.load(content)('img').first().attr('src') ||
          '',
        audioUrl: node.find('enclosure').first().attr('url') || '',
        guestBio: extractGuestBio(showNotes, guestLabel),
        showNotes,
      };
    })
    .filter((episode) => episode.id && episode.episodeNumber > 0)
    .sort((left, right) => right.episodeNumber - left.episodeNumber);

  if (episodes.length === 0) {
    throw new Error('RSS returned no numbered episodes');
  }

  const expectedNumbers = Array.from({ length: episodes[0].episodeNumber }, (_, index) => index + 1);
  const receivedNumbers = [...episodes].map((episode) => episode.episodeNumber).sort((a, b) => a - b);
  if (JSON.stringify(expectedNumbers) !== JSON.stringify(receivedNumbers)) {
    throw new Error(`Episode sequence is incomplete: received ${receivedNumbers.join(', ')}`);
  }

  const payload = {
    showName: $('channel > title').first().text().trim(),
    source: config.rssUrl,
    sourceUpdatedAt: episodes[0].publishedAt,
    episodeCount: episodes.length,
    episodes,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Synced ${episodes.length} episodes to ${path.relative(rootDir, outputPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
