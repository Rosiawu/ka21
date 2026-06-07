import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { captureLiveDashboardData } from '../../../../../scripts/podcast/capture-snapshot';
import { requireAdminAccess } from '@/lib/security/admin';
import { beginConcurrencyLease, enforceRateLimit } from '@/lib/security/rate-limit';

type PlatformConfig = {
  id: string;
  name: string;
  url: string;
  logo?: string;
};

type PodcastConfig = {
  showName: string;
  rssUrl: string;
  platforms: ReadonlyArray<PlatformConfig>;
};

const defaultConfig: PodcastConfig = {
  showName: '灯下白',
  rssUrl: 'https://feed.xyzfm.space/labr6f9g6xvp',
  platforms: [
    {
      id: 'xiaoyuzhou',
      name: '小宇宙',
      url: 'https://www.xiaoyuzhoufm.com/podcast/69a44f5aa19c08db64bbd8a7',
      logo: '/images/podcast/platforms/xiaoyuzhou.png',
    },
    {
      id: 'apple',
      name: '苹果播客',
      url: 'https://podcasts.apple.com/cn/podcast/%E7%81%AF%E4%B8%8B%E7%99%BD/id1883429226',
      logo: '/images/podcast/platforms/apple.png',
    },
    {
      id: 'lizhi',
      name: '荔枝',
      url: 'https://m.lizhi.fm/voicesheet/5500330523200853569',
      logo: '/images/podcast/platforms/lizhi.png',
    },
    {
      id: 'ximalaya',
      name: '喜马拉雅',
      url: 'https://www.ximalaya.com/album/33817634',
      logo: '/images/podcast/platforms/ximalaya.png',
    },
    {
      id: 'wangyiyun',
      name: '网易云音乐',
      url: 'https://music.163.com/#/djradio?id=1487456047',
      logo: '/images/podcast/platforms/wangyiyun.png',
    },
    {
      id: 'qingting',
      name: '蜻蜓FM',
      url: 'https://m.qtfm.cn/vchannels/526838',
      logo: '/images/podcast/platforms/qingting.png',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UC4vwgT8e3dYo0ra_bDqIq9A',
      logo: '/images/podcast/platforms/youtube.png',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      url: 'https://open.spotify.com/show/7s1L3Bl9QD3tWTmGnPW4y0?si=jNefx-5VRfiW8N9r-OD25Q',
      logo: '/images/podcast/platforms/spotify.png',
    },
  ],
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Snapshot = {
  id: string;
  date: string;
  note: string;
  platformTotals: Record<string, number>;
  episodePlays: Record<string, Record<string, number>>;
  createdAt: string;
};

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

const podcastDataDir = path.join(process.cwd(), 'data', 'podcast-dashboard');
const trackerConfigPath = path.join(podcastDataDir, 'config.json');
const trackerSnapshotsPath = path.join(podcastDataDir, 'snapshots.json');
const trackerEpisodesCachePath = path.join(podcastDataDir, 'episodes-cache.json');
const dashboardRefreshHeader = 'x-ka21-dashboard-refresh';
const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

async function fetchRepoJson<T>(relativePath: string): Promise<T> {
  const repo = process.env.GITHUB_REPO || 'Rosiawu/ka21';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${relativePath}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'user-agent': 'ka21-podcast-dashboard/1.0',
      accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativePath} from GitHub: ${response.status}`);
  }

  return (await response.json()) as T;
}

function isTrustedDashboardRefreshRequest(request: Request) {
  if (request.headers.get(dashboardRefreshHeader) !== '1') {
    return false;
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin')?.trim();
  if (origin && origin === requestOrigin) {
    return true;
  }

  const referer = request.headers.get('referer')?.trim();
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return refererUrl.origin === requestOrigin && refererUrl.pathname.startsWith('/podcast-dashboard');
  } catch {
    return false;
  }
}

function requireDashboardRefreshAccess(request: Request) {
  const adminError = requireAdminAccess(request);
  if (!adminError) {
    return null;
  }

  if (isTrustedDashboardRefreshRequest(request)) {
    return null;
  }

  return jsonResponse(
    {
      error: 'dashboard_refresh_forbidden',
      message: 'Dashboard refresh is only available from the podcast dashboard page',
    },
    403,
  );
}

async function loadConfig(): Promise<PodcastConfig> {
  try {
    const parsed = await fetchRepoJson<PodcastConfig>('data/podcast-dashboard/config.json');
    if (parsed && Array.isArray(parsed.platforms)) {
      return parsed;
    }
  } catch {
    // Fall back to the bundled file if GitHub raw data is temporarily unavailable.
  }

  try {
    const raw = await readFile(trackerConfigPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.platforms)) {
      return defaultConfig;
    }
    return parsed;
  } catch {
    return defaultConfig;
  }
}

async function loadSnapshots(): Promise<Snapshot[]> {
  try {
    const parsed = await fetchRepoJson<Snapshot[]>('data/podcast-dashboard/snapshots.json');
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to the bundled file if GitHub raw data is temporarily unavailable.
  }

  try {
    const raw = await readFile(trackerSnapshotsPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

async function loadEpisodesCache() {
  try {
    const parsed = await fetchRepoJson<{ episodes?: Array<{ id: string; title: string; pubDate: string; duration: string; link: string }> }>(
      'data/podcast-dashboard/episodes-cache.json',
    );
    if (Array.isArray(parsed.episodes) && parsed.episodes.length > 0) {
      return parsed.episodes;
    }
  } catch {
    // Fall back to the bundled cache if GitHub raw data is temporarily unavailable.
  }

  try {
    const raw = await readFile(trackerEpisodesCachePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.episodes) && parsed.episodes.length > 0) {
      return parsed.episodes;
    }
  } catch {
    // The caller will surface the RSS error if no cache exists.
  }

  return null;
}

async function loadEpisodes(config: PodcastConfig) {
  let rssError: unknown = null;

  try {
    const response = await fetch(config.rssUrl, {
      headers: {
        'user-agent': 'ka21-podcast-dashboard/1.0',
        accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      next: { revalidate: 3600 },
    } as NextFetchInit);

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const episodes = $('channel > item')
      .toArray()
      .map((item, index) => {
        const node = $(item);
        const guid = node.find('guid').first().text().trim() || node.find('link').first().text().trim() || `episode-${index + 1}`;

        return {
          id: guid,
          title: node.find('title').first().text().trim() || `Episode ${index + 1}`,
          pubDate: node.find('pubDate').first().text().trim(),
          duration: node.find('itunes\\:duration').first().text().trim(),
          link: node.find('link').first().text().trim(),
        };
      });

    if (episodes.length > 0) {
      return episodes;
    }

    rssError = new Error('RSS feed returned no episodes');
  } catch (error) {
    rssError = error;
  }

  const cachedEpisodes = await loadEpisodesCache();
  if (cachedEpisodes) {
    return cachedEpisodes;
  }

  throw rssError instanceof Error ? rssError : new Error('Failed to load podcast episodes');
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

function mergeSnapshotByDate(snapshots: Snapshot[], snapshot: Snapshot | null) {
  if (!snapshot) {
    return snapshots;
  }

  const sameDay = snapshots.filter((item) => item.date === snapshot.date);
  const bestSameDay = sameDay.reduce<Snapshot | null>(
    (best, item) => (best && compareSnapshots(best, item) >= 0 ? best : item),
    null,
  );
  const winner = bestSameDay && compareSnapshots(bestSameDay, snapshot) >= 0 ? bestSameDay : snapshot;
  return [...snapshots.filter((item) => item.date !== snapshot.date), winner].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
}

export async function GET() {
  try {
    const config = await loadConfig();
    const [episodes, snapshots] = await Promise.all([loadEpisodes(config), loadSnapshots()]);
    return jsonResponse({ config, episodes, snapshots });
  } catch (error) {
    return jsonResponse(
      {
        error: 'dashboard_load_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  const accessError = requireDashboardRefreshAccess(request);
  if (accessError) {
    return accessError;
  }

  const rateLimitResponse = enforceRateLimit(request, {
    name: 'podcast-dashboard-refresh',
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const releaseConcurrency = beginConcurrencyLease('podcast-dashboard-refresh', 1);
  if (!releaseConcurrency) {
    return jsonResponse(
      {
        error: 'dashboard_refresh_busy',
        message: 'Refresh already running',
      },
      429,
    );
  }

  try {
    const payload = await captureLiveDashboardData({
      dryRun: false,
      persist: true,
      allowWriteFailure: true,
    });
    const [freshEpisodes, freshSnapshots] = await Promise.all([
      loadEpisodes(payload.config),
      loadSnapshots(),
    ]);
    const episodes = freshEpisodes.length >= payload.episodes.length ? freshEpisodes : payload.episodes;
    const snapshots = mergeSnapshotByDate(freshSnapshots, payload.snapshot);

    return jsonResponse({
      config: payload.config,
      episodes,
      snapshots,
      refreshed: true,
      persisted: payload.persisted,
      snapshot: payload.snapshot,
      skipped: payload.skipped,
      results: payload.results,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: 'dashboard_refresh_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  } finally {
    releaseConcurrency();
  }
}
