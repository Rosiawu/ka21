import * as cheerio from 'cheerio';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

type Platform = {
  id: string;
  name: string;
  url: string;
};

type PodcastConfig = {
  showName: string;
  rssUrl: string;
  platforms: Platform[];
};

type Episode = {
  id: string;
  title: string;
  pubDate: string;
  duration: string;
  link: string;
};

type Snapshot = {
  id: string;
  date: string;
  note: string;
  platformTotals: Record<string, number>;
  episodePlays: Record<string, Record<string, number>>;
  createdAt: string;
};

type ScrapeResult = {
  platformId: string;
  supported: boolean;
  note: string;
  total: number | null;
  episodePlays: Record<string, number>;
};

type EpisodeCache = {
  updatedAt: string;
  source: string;
  episodes: Episode[];
};

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data', 'podcast-dashboard');
const configPath = path.join(dataDir, 'config.json');
const snapshotsPath = path.join(dataDir, 'snapshots.json');
const episodesCachePath = path.join(dataDir, 'episodes-cache.json');

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeError(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const details: string[] = [];
  if (error.message) {
    details.push(error.message);
  }

  const errorCode = (error as Error & { code?: string }).code;
  if (typeof errorCode === 'string') {
    details.push(`code=${errorCode}`);
  }

  const stderr = (error as Error & { stderr?: string }).stderr;
  if (typeof stderr === 'string' && stderr.trim()) {
    details.push(stderr.trim());
  }

  const cause = error.cause;
  if (cause && typeof cause === 'object') {
    const causeCode = (cause as { code?: string }).code;
    const causeMessage = (cause as { message?: string }).message;
    if (typeof causeCode === 'string') {
      details.push(`code=${causeCode}`);
    }
    if (typeof causeMessage === 'string' && causeMessage !== error.message) {
      details.push(causeMessage);
    }
  }

  return details.join('; ') || String(error);
}

function isRetryable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === 'AbortError') {
    return true;
  }

  return /fetch failed|timeout|timed out|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|UND_ERR/i.test(
    describeError(error),
  );
}

function buildRequestError(context: string, url: string, error: unknown) {
  const label = context || url;
  return new Error(`Request failed for ${label} (${url}): ${describeError(error)}`, { cause: error });
}

async function fetchTextWithCurl(
  url: string,
  { headers = {}, timeoutMs = 8_000, context = '' }: { headers?: Record<string, string>; timeoutMs?: number; context?: string } = {},
) {
  const args = [
    '--silent',
    '--show-error',
    '--location',
    '--compressed',
    '--max-time',
    String(Math.max(1, Math.ceil(timeoutMs / 1000))),
    '--user-agent',
    'Mozilla/5.0',
  ];

  for (const [name, value] of Object.entries(headers)) {
    args.push('--header', `${name}: ${value}`);
  }

  args.push(url);

  try {
    const { stdout } = await execFile('curl', args, {
      timeout: timeoutMs + 1_000,
      maxBuffer: 15 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    throw buildRequestError(context, url, error);
  }
}

function buildCombinedFallbackError(context: string, url: string, primaryError: unknown, fallbackError: unknown) {
  const label = context || url;
  return new Error(
    `Request failed for ${label} (${url}): fetch=${describeError(primaryError)}; curl=${describeError(fallbackError)}`,
    { cause: fallbackError },
  );
}

function normalizeFetchError(error: unknown, fallback = '抓取失败') {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.name === 'AbortError') {
    return '当前网络下连接超时，稍后可重试';
  }

  if (/connect timeout|timed out|AbortError/i.test(describeError(error))) {
    return '当前网络下连接超时，稍后可重试';
  }

  if (/fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|UND_ERR/i.test(describeError(error))) {
    return '当前网络下无法访问该平台公开页';
  }

  return error.message || fallback;
}

async function fetchText(
  url: string,
  {
    headers = {},
    timeoutMs = 8_000,
    retries = 2,
    retryDelayMs = 750,
    context = '',
    logger = console,
  }: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
    context?: string;
    logger?: Pick<typeof console, 'warn'>;
  } = {},
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'ka21-podcast-dashboard/1.0',
          accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8',
          ...headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError = buildRequestError(context, url, error);
      const retryable = isRetryable(error);
      const hasNextAttempt = attempt <= retries;

      if (retryable) {
        try {
          return await fetchTextWithCurl(url, { headers, timeoutMs, context });
        } catch (curlError) {
          lastError = buildCombinedFallbackError(context, url, error, curlError);
        }
      }

      if (!retryable || !hasNextAttempt) {
        throw lastError;
      }

      logger.warn(`[retry ${attempt}/${retries}] ${context || url} -> ${describeError(error)}`);
      await sleep(retryDelayMs * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error(`Request failed for ${context || url} (${url})`);
}

function normalizeTitle(title: string) {
  return String(title || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEpisodeNumber(title: string) {
  const match = String(title || '').match(/^\s*(\d+)\s*\./);
  return match ? String(Number(match[1])) : '';
}

function parseJsonScript<T>(html: string, scriptId: string) {
  const pattern = new RegExp(`<script[^>]*id=["']${scriptId}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = String(html || '').match(pattern);
  if (!match) {
    throw new Error(`Missing script payload: ${scriptId}`);
  }

  return JSON.parse(match[1]) as T;
}

function parseCompactNumber(text: string) {
  const value = String(text || '').trim();
  if (!value || value === '---' || value === '--') {
    return null;
  }
  if (/^no views$/i.test(value)) {
    return 0;
  }

  const cleaned = value.replace(/收看次數：|觀看次數：|views?|次|,/gi, '').trim().toUpperCase();
  const match = cleaned.match(/^([\d.]+)\s*([KMBW万亿]?)$/i);
  if (!match) {
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  }

  const base = Number(match[1]);
  if (!Number.isFinite(base)) {
    return null;
  }

  const unit = match[2];
  const multipliers: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
    W: 10_000,
    万: 10_000,
    亿: 100_000_000,
    '': 1,
  };

  return Math.round(base * (multipliers[unit] || 1));
}

function extractId(url: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = String(url || '').match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function buildEpisodeMap(episodes: Episode[]) {
  const map = new Map<string, string>();
  for (const episode of episodes) {
    const normalized = normalizeTitle(episode.title);
    const number = extractEpisodeNumber(episode.title);
    map.set(normalized, episode.id);
    if (number) {
      map.set(`episode-number:${number}`, episode.id);
    }
  }
  return map;
}

function matchEpisodeId(titleMap: Map<string, string>, title: string) {
  const normalized = normalizeTitle(title);
  const direct = titleMap.get(normalized);
  if (direct) {
    return direct;
  }

  const number = extractEpisodeNumber(title);
  if (number) {
    return titleMap.get(`episode-number:${number}`) || null;
  }

  return null;
}

function normalizeEpisode(raw: Partial<Episode>, fallbackId: string, fallbackTitle: string): Episode | null {
  const id = String(raw.id || fallbackId || '').trim();
  const title = String(raw.title || fallbackTitle || '').trim();
  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    pubDate: String(raw.pubDate || '').trim(),
    duration: String(raw.duration || '').trim(),
    link: String(raw.link || '').trim() || `https://www.xiaoyuzhoufm.com/episode/${id}`,
  };
}

function ensureEpisodesLoaded(episodes: (Episode | null)[], source: string) {
  const normalized = episodes.filter(Boolean) as Episode[];
  if (normalized.length === 0) {
    throw new Error(`${source} returned no episodes`);
  }

  return normalized;
}

async function writeEpisodesCache(episodes: Episode[], source: string) {
  const payload: EpisodeCache = {
    updatedAt: new Date().toISOString(),
    source,
    episodes,
  };

  await writeJson(episodesCachePath, payload);
}

async function readEpisodesCache() {
  const parsed = await readJson<EpisodeCache>(episodesCachePath);
  return ensureEpisodesLoaded(
    (parsed.episodes || []).map((episode, index) => normalizeEpisode(episode, `cached-${index + 1}`, `Episode ${index + 1}`)),
    'cache',
  );
}

async function loadEpisodesFromRss(config: PodcastConfig) {
  const xml = await fetchText(config.rssUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    context: 'RSS feed',
    timeoutMs: 10_000,
    retries: 2,
  });

  const $ = cheerio.load(xml, { xmlMode: true });

  return ensureEpisodesLoaded(
    $('channel > item')
      .toArray()
      .map((item, index) => {
        const node = $(item);
        return normalizeEpisode(
          {
            id: node.find('guid').first().text().trim() || node.find('link').first().text().trim(),
            title: node.find('title').first().text().trim(),
            pubDate: node.find('pubDate').first().text().trim(),
            duration: node.find('itunes\\:duration').first().text().trim(),
            link: node.find('link').first().text().trim(),
          },
          `episode-${index + 1}`,
          `Episode ${index + 1}`,
        );
      }),
    'RSS',
  );
}

async function loadEpisodesFromXiaoyuzhou(config: PodcastConfig) {
  const xiaoyuzhouUrl = config.platforms.find((platform) => platform.id === 'xiaoyuzhou')?.url || '';
  if (!xiaoyuzhouUrl) {
    throw new Error('Missing Xiaoyuzhou URL in config');
  }

  const html = await fetchText(xiaoyuzhouUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    },
    context: 'Xiaoyuzhou episode page',
    timeoutMs: 10_000,
    retries: 2,
  });

  const data = parseJsonScript<{ props?: { pageProps?: { episodes?: Array<Partial<Episode> & { eid?: string }>; podcast?: { episodes?: Array<Partial<Episode> & { eid?: string }> } } } }>(
    html,
    '__NEXT_DATA__',
  );
  const sourceEpisodes = data?.props?.pageProps?.episodes || data?.props?.pageProps?.podcast?.episodes || [];

  return ensureEpisodesLoaded(
    sourceEpisodes.map((episode, index) =>
      normalizeEpisode(
        {
          id: episode.eid || episode.id,
          title: episode.title,
          pubDate: episode.pubDate,
          duration: episode.duration,
          link: episode.link,
        },
        `xiaoyuzhou-${index + 1}`,
        `Episode ${index + 1}`,
      ),
    ),
    'Xiaoyuzhou',
  );
}

async function loadEpisodesFromConfig(config: PodcastConfig, logger = console) {
  try {
    const episodes = await loadEpisodesFromRss(config);
    await writeEpisodesCache(episodes, 'rss');
    return episodes;
  } catch (error) {
    logger.warn(`[episodes] RSS unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const episodes = await loadEpisodesFromXiaoyuzhou(config);
    await writeEpisodesCache(episodes, 'xiaoyuzhou');
    return episodes;
  } catch (error) {
    logger.warn(`[episodes] Xiaoyuzhou fallback unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  const cachedEpisodes = await readEpisodesCache();
  logger.warn('[episodes] Using cached episode list.');
  return cachedEpisodes;
}

async function scrapeXiaoyuzhou(platform: Platform, episodes: Episode[]): Promise<ScrapeResult> {
  const html = await fetchText(platform.url, { context: `${platform.id} page` });
  const data = parseJsonScript<{ props?: { pageProps?: { episodes?: Array<{ title?: string; playCount?: number }>; podcast?: { episodes?: Array<{ title?: string; playCount?: number }>; subscriptionCount?: number } } } }>(
    html,
    '__NEXT_DATA__',
  );
  const pageProps = data?.props?.pageProps;
  const titleMap = buildEpisodeMap(episodes);
  const sourceEpisodes = pageProps?.episodes || pageProps?.podcast?.episodes || [];
  const episodePlays: Record<string, number> = {};
  let total = 0;

  for (const episode of sourceEpisodes) {
    const episodeId = matchEpisodeId(titleMap, episode.title || '');
    const playCount = Number(episode.playCount || 0);
    if (!episodeId) {
      continue;
    }
    episodePlays[episodeId] = playCount;
    total += playCount;
  }

  return {
    platformId: platform.id,
    supported: true,
    note: `公开页可抓取，总订阅 ${pageProps?.podcast?.subscriptionCount ?? '?'}`,
    total,
    episodePlays,
  };
}

async function scrapeXimalaya(platform: Platform, episodes: Episode[]): Promise<ScrapeResult> {
  const albumId = extractId(platform.url, [/album\/(\d+)/i]);
  if (!albumId) {
    throw new Error('Unable to extract Ximalaya album ID');
  }

  const [albumRaw, tracksRaw] = await Promise.all([
    fetchText(`https://www.ximalaya.com/revision/album?albumId=${albumId}`, {
      headers: { referer: platform.url },
      context: `${platform.id} album API`,
    }),
    fetchText(`https://mobile.ximalaya.com/mobile/v1/album/track?albumId=${albumId}&pageNum=1&pageSize=30`, {
      headers: { referer: platform.url },
      context: `${platform.id} track API`,
    }),
  ]);

  const album = JSON.parse(albumRaw) as { data?: { mainInfo?: { playCount?: number; subscribeCount?: number } } };
  const tracks = JSON.parse(tracksRaw) as { data?: { list?: Array<{ title?: string; playtimes?: number }> } };
  const titleMap = buildEpisodeMap(episodes);
  const episodePlays: Record<string, number> = {};

  for (const track of tracks?.data?.list || []) {
    const episodeId = matchEpisodeId(titleMap, track.title || '');
    if (!episodeId) {
      continue;
    }
    episodePlays[episodeId] = Number(track.playtimes || 0);
  }

  return {
    platformId: platform.id,
    supported: true,
    note: `公开 API 可抓取，总订阅 ${album?.data?.mainInfo?.subscribeCount ?? '?'}`,
    total: Number(album?.data?.mainInfo?.playCount || 0),
    episodePlays,
  };
}

async function scrapeWangyiyun(platform: Platform, episodes: Episode[]): Promise<ScrapeResult> {
  const radioId = extractId(platform.url, [/djradio\?id=(\d+)/i, /radioId=(\d+)/i]);
  if (!radioId) {
    throw new Error('Unable to extract Netease radio ID');
  }

  const [radioRaw, html] = await Promise.all([
    fetchText(`https://music.163.com/api/djradio/v2/get?id=${radioId}`, {
      headers: { referer: 'https://music.163.com/' },
      context: `${platform.id} radio API`,
    }),
    fetchText(`https://music.163.com/djradio?id=${radioId}`, {
      headers: { referer: 'https://music.163.com/' },
      context: `${platform.id} public page`,
    }),
  ]);

  const radio = JSON.parse(radioRaw) as { data?: { subCount?: number } };
  const titleMap = buildEpisodeMap(episodes);
  const episodePlays: Record<string, number> = {};
  let total = 0;

  for (const episode of episodes) {
    const escapedTitle = normalizeTitle(episode.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const episodeNumber = extractEpisodeNumber(episode.title);
    const escapedNumber = episodeNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `title="${escapedTitle}"[\\s\\S]{0,1200}?<td class="col3"><span class="s-fc3">播放(\\d+)</span>`,
      'u',
    );
    const fallbackPattern = episodeNumber
      ? new RegExp(
          `title="0*${escapedNumber}\\.([^"]*)"[\\s\\S]{0,1200}?<td class="col3"><span class="s-fc3">播放(\\d+)</span>`,
          'u',
        )
      : null;
    const match = html.match(pattern) || (fallbackPattern ? html.match(fallbackPattern) : null);
    const episodeId = matchEpisodeId(titleMap, episode.title);
    if (!episodeId) {
      continue;
    }

    const playCount = match ? Number(match[match.length - 1]) : 0;
    episodePlays[episodeId] = playCount;
    total += playCount;
  }

  return {
    platformId: platform.id,
    supported: true,
    note: `公开页列表可抓取，总订阅 ${radio?.data?.subCount ?? '?'}`,
    total,
    episodePlays,
  };
}

async function scrapeLizhi(platform: Platform, episodes: Episode[]): Promise<ScrapeResult> {
  const sheetId = extractId(platform.url, [/voicesheet\/(\d+)/i]);
  if (!sheetId) {
    throw new Error('Unable to extract Lizhi voicesheet ID');
  }

  const titleMap = buildEpisodeMap(episodes);
  const episodePlays: Record<string, number> = {};
  const voices: Array<{ name?: string; title?: string; playCount?: number }> = [];
  let page = 1;
  let isLastPage = false;

  while (!isLastPage) {
    const raw = await fetchText(`https://m.lizhi.fm/vodapi/playsheet/data?id=${sheetId}&page=${page}&count=50`, {
      headers: { referer: platform.url },
      context: `${platform.id} mobile API page ${page}`,
    });
    const payload = JSON.parse(raw) as { voices?: Array<{ name?: string; title?: string; playCount?: number }>; isLastPage?: boolean };
    const pageVoices = Array.isArray(payload?.voices) ? payload.voices : [];
    voices.push(...pageVoices);
    isLastPage = Boolean(payload?.isLastPage) || pageVoices.length === 0;
    page += 1;
  }

  let total = 0;
  for (const voice of voices) {
    const episodeId = matchEpisodeId(titleMap, voice.name || voice.title || '');
    const playCount = Number(voice.playCount || 0);
    total += playCount;
    if (!episodeId) {
      continue;
    }
    episodePlays[episodeId] = playCount;
  }

  return {
    platformId: platform.id,
    supported: true,
    note: `手机公开 API 可抓取，共 ${voices.length || 0} 期`,
    total,
    episodePlays,
  };
}

async function scrapeYoutube(platform: Platform, episodes: Episode[]): Promise<ScrapeResult> {
  const videosUrl = platform.url.endsWith('/videos')
    ? `${platform.url}?view=0&sort=dd&flow=grid&hl=en`
    : `${platform.url.replace(/\/$/, '')}/videos?view=0&sort=dd&flow=grid&hl=en`;
  const html = await fetchText(videosUrl, {
    headers: { 'accept-language': 'en-US,en;q=0.9' },
    timeoutMs: 6_000,
    context: `${platform.id} videos page`,
  });

  const episodePlays: Record<string, number> = {};
  let total = 0;

  for (const episode of episodes) {
    const escapedTitle = normalizeTitle(episode.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `"title":\\{"runs":\\[\\{"text":"${escapedTitle}"\\}[\\s\\S]{0,2200}?"viewCountText":\\{"simpleText":"([^"]+)"`,
      'u',
    );
    const match = html.match(pattern);
    if (!match) {
      continue;
    }

    const plays = parseCompactNumber(match[1]);
    if (plays === null) {
      continue;
    }

    episodePlays[episode.id] = plays;
    total += plays;
  }

  return {
    platformId: platform.id,
    supported: true,
    note: '抓取的是公开视频观看数，不是 YouTube Studio 内部播客分析口径',
    total,
    episodePlays,
  };
}

function scrapeUnsupported(platform: Platform, reason: string): ScrapeResult {
  return {
    platformId: platform.id,
    supported: false,
    note: reason,
    total: null,
    episodePlays: {},
  };
}

async function scrapePublicCounts(config: PodcastConfig, episodes: Episode[]) {
  const results: ScrapeResult[] = [];

  for (const platform of config.platforms) {
    try {
      if (!platform.url) {
        results.push(scrapeUnsupported(platform, '未配置公开页链接'));
        continue;
      }

      switch (platform.id) {
        case 'xiaoyuzhou':
          results.push(await scrapeXiaoyuzhou(platform, episodes));
          break;
        case 'ximalaya':
          results.push(await scrapeXimalaya(platform, episodes));
          break;
        case 'wangyiyun':
          results.push(await scrapeWangyiyun(platform, episodes));
          break;
        case 'youtube':
          results.push(await scrapeYoutube(platform, episodes));
          break;
        case 'lizhi':
          results.push(await scrapeLizhi(platform, episodes));
          break;
        case 'apple':
          results.push(scrapeUnsupported(platform, 'Apple 公开节目页不提供播放量'));
          break;
        case 'spotify':
          results.push(scrapeUnsupported(platform, 'Spotify 公开节目页不提供播放量'));
          break;
        case 'qingting':
          results.push(scrapeUnsupported(platform, '蜻蜓公开页和公开 GraphQL 都对该节目返回 playcount=---'));
          break;
        default:
          results.push(scrapeUnsupported(platform, '当前没有为该平台配置抓取器'));
      }
    } catch (error) {
      console.warn(`[scrape:${platform.id}] ${error instanceof Error ? error.message : String(error)}`);
      results.push({
        platformId: platform.id,
        supported: false,
        note: normalizeFetchError(error),
        total: null,
        episodePlays: {},
      });
    }
  }

  const platformTotals: Record<string, number> = {};
  const episodePlays: Record<string, Record<string, number>> = {};

  for (const result of results) {
    if (result.supported && result.total !== null) {
      platformTotals[result.platformId] = result.total;
    }

    for (const [episodeId, value] of Object.entries(result.episodePlays || {})) {
      episodePlays[episodeId] ||= {};
      episodePlays[episodeId][result.platformId] = value;
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    platformTotals,
    episodePlays,
    results,
  };
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return Math.round(number);
}

function normalizeSnapshot(
  payload: Partial<Snapshot>,
  config: PodcastConfig,
  episodes: Episode[],
): Snapshot {
  const platformIds = new Set(config.platforms.map((platform) => platform.id));
  const episodeIds = new Set(episodes.map((episode) => episode.id));

  const normalized: Snapshot = {
    id: payload.id || `snapshot-${Date.now()}`,
    date: String(payload.date || '').trim(),
    note: String(payload.note || '').trim(),
    platformTotals: {},
    episodePlays: {},
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  for (const [platformId, value] of Object.entries(payload.platformTotals || {})) {
    if (!platformIds.has(platformId)) {
      continue;
    }
    const normalizedValue = normalizeNumber(value);
    if (normalizedValue !== null) {
      normalized.platformTotals[platformId] = normalizedValue;
    }
  }

  for (const [episodeId, values] of Object.entries(payload.episodePlays || {})) {
    if (!episodeIds.has(episodeId)) {
      continue;
    }

    const platformValues: Record<string, number> = {};
    for (const [platformId, value] of Object.entries(values || {})) {
      if (!platformIds.has(platformId)) {
        continue;
      }

      const normalizedValue = normalizeNumber(value);
      if (normalizedValue !== null) {
        platformValues[platformId] = normalizedValue;
      }
    }

    if (Object.keys(platformValues).length > 0) {
      normalized.episodePlays[episodeId] = platformValues;
    }
  }

  return normalized;
}

function sumObjectValues(object: Record<string, number> = {}) {
  return Object.values(object).reduce((sum, value) => sum + Number(value || 0), 0);
}

function snapshotRank(snapshot: Snapshot) {
  const note = String(snapshot.note || '').trim();
  if (note === '自动抓取') {
    return 3;
  }
  if (note) {
    return 2;
  }
  return 1;
}

function snapshotTotals(snapshot: Snapshot) {
  return {
    platformTotal: sumObjectValues(snapshot.platformTotals || {}),
    episodeTotal: Object.values(snapshot.episodePlays || {}).reduce((sum, values) => sum + sumObjectValues(values || {}), 0),
  };
}

function compareSnapshots(left: Snapshot, right: Snapshot) {
  const leftTotals = snapshotTotals(left);
  const rightTotals = snapshotTotals(right);

  if (leftTotals.platformTotal !== rightTotals.platformTotal) {
    return leftTotals.platformTotal - rightTotals.platformTotal;
  }

  if (leftTotals.episodeTotal !== rightTotals.episodeTotal) {
    return leftTotals.episodeTotal - rightTotals.episodeTotal;
  }

  const rankDiff = snapshotRank(left) - snapshotRank(right);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
}

function hasSnapshotData(snapshot: Snapshot) {
  return (
    sumObjectValues(snapshot.platformTotals || {}) > 0 ||
    Object.values(snapshot.episodePlays || {}).some((values) => sumObjectValues(values || {}) > 0)
  );
}

function chinaDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const config = await readJson<PodcastConfig>(configPath);
  const snapshots = await readJson<Snapshot[]>(snapshotsPath);
  const episodes = await loadEpisodesFromConfig(config);
  const counts = await scrapePublicCounts(config, episodes);

  const snapshot = normalizeSnapshot(
    {
      date: chinaDateString(),
      note: '自动抓取',
      platformTotals: counts.platformTotals,
      episodePlays: counts.episodePlays,
    },
    config,
    episodes,
  );

  if (!hasSnapshotData(snapshot)) {
    const sameDayWithData = snapshots.some((item) => item.date === snapshot.date && hasSnapshotData(item));
    if (sameDayWithData) {
      console.log(JSON.stringify({ skipped: true, reason: 'no_new_data_keep_existing_snapshot' }, null, 2));
      return;
    }
    throw new Error('No public data captured. Snapshot not written.');
  }

  const sameDay = snapshots.filter((item) => item.date === snapshot.date);
  const bestSameDay = sameDay.reduce<Snapshot | null>(
    (best, item) => (best && compareSnapshots(best, item) >= 0 ? best : item),
    null,
  );
  const winner = bestSameDay && compareSnapshots(bestSameDay, snapshot) >= 0 ? bestSameDay : snapshot;

  const filtered = snapshots.filter((item) => item.date !== snapshot.date);
  filtered.push(winner);
  filtered.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  if (!dryRun) {
    await writeJson(snapshotsPath, filtered);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        snapshot: winner,
        results: counts.results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
