import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { captureLiveDashboardData } from '../../../../../scripts/podcast/capture-snapshot';
import { requireAdminAccess } from '@/lib/security/admin';
import { beginConcurrencyLease, enforceRateLimit } from '@/lib/security/rate-limit';

const defaultConfig = {
  showName: '灯下白',
  rssUrl: 'https://feed.xyzfm.space/labr6f9g6xvp',
  platforms: [
    {
      id: 'xiaoyuzhou',
      name: '小宇宙',
      url: 'https://www.xiaoyuzhoufm.com/podcast/69a44f5aa19c08db64bbd8a7',
    },
    {
      id: 'apple',
      name: '苹果播客',
      url: 'https://podcasts.apple.com/cn/podcast/%E7%81%AF%E4%B8%8B%E7%99%BD/id1883429226',
    },
    {
      id: 'lizhi',
      name: '荔枝',
      url: 'https://m.lizhi.fm/voicesheet/5500330523200853569',
    },
    {
      id: 'ximalaya',
      name: '喜马拉雅',
      url: 'https://www.ximalaya.com/album/33817634',
    },
    {
      id: 'wangyiyun',
      name: '网易云音乐',
      url: 'https://music.163.com/#/djradio?id=1487456047',
    },
    {
      id: 'qingting',
      name: '蜻蜓FM',
      url: 'https://m.qtfm.cn/vchannels/526838',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UC4vwgT8e3dYo0ra_bDqIq9A',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      url: 'https://open.spotify.com/show/7s1L3Bl9QD3tWTmGnPW4y0?si=jNefx-5VRfiW8N9r-OD25Q',
    },
  ],
} as const;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PlatformConfig = (typeof defaultConfig.platforms)[number];
type PodcastConfig = {
  showName: string;
  rssUrl: string;
  platforms: ReadonlyArray<PlatformConfig>;
};

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
const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

async function loadConfig(): Promise<PodcastConfig> {
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

async function loadEpisodes(config: PodcastConfig) {
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

  return $('channel > item')
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
  const adminError = requireAdminAccess(request);
  if (adminError) {
    return adminError;
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

    return jsonResponse({
      config: payload.config,
      episodes: payload.episodes,
      snapshots: payload.snapshots,
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
