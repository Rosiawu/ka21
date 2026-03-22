import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';

const config = {
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

const TRACKER_SNAPSHOTS_PATH =
  '/Users/rosiawoo/Downloads/podcast editing/podcast-stats-tracker/data/snapshots.json';

const fallbackSnapshots = [
  {
    id: 'snapshot-1773134584215',
    date: '2026-03-10',
    note: '首次公开页抓取',
    platformTotals: {
      xiaoyuzhou: 85,
      ximalaya: 113,
      wangyiyun: 35,
    },
    episodePlays: {
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 29,
        ximalaya: 49,
        wangyiyun: 0,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 56,
        ximalaya: 64,
        wangyiyun: 35,
      },
    },
    createdAt: '2026-03-10T09:23:04.215Z',
  },
  {
    id: 'snapshot-1773209471638',
    date: '2026-03-11',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 93,
      ximalaya: 116,
      wangyiyun: 35,
    },
    episodePlays: {
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 31,
        ximalaya: 52,
        wangyiyun: 0,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 62,
        ximalaya: 64,
        wangyiyun: 35,
      },
    },
    createdAt: '2026-03-11T06:11:11.638Z',
  },
  {
    id: 'snapshot-1773382099951',
    date: '2026-03-13',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 121,
      ximalaya: 178,
      wangyiyun: 36,
      youtube: 0,
    },
    episodePlays: {
      '69b184e184bce022f9f4fd5b': {
        xiaoyuzhou: 11,
        ximalaya: 54,
        wangyiyun: 0,
        youtube: 0,
      },
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 37,
        ximalaya: 57,
        wangyiyun: 1,
        youtube: 0,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 73,
        ximalaya: 67,
        wangyiyun: 35,
        youtube: 0,
      },
    },
    createdAt: '2026-03-13T06:08:19.951Z',
  },
  {
    id: 'snapshot-1773547662820',
    date: '2026-03-15',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 136,
      ximalaya: 192,
      wangyiyun: 36,
      youtube: 0,
    },
    episodePlays: {
      '69b184e184bce022f9f4fd5b': {
        xiaoyuzhou: 13,
        ximalaya: 58,
        wangyiyun: 0,
        youtube: 0,
      },
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 45,
        ximalaya: 60,
        wangyiyun: 1,
        youtube: 0,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 78,
        ximalaya: 74,
        wangyiyun: 35,
        youtube: 0,
      },
    },
    createdAt: '2026-03-15T04:07:42.820Z',
  },
  {
    id: 'snapshot-1773669533352',
    date: '2026-03-16',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 156,
      lizhi: 87,
      ximalaya: 204,
      wangyiyun: 46,
      youtube: 0,
    },
    episodePlays: {
      '69b184e184bce022f9f4fd5b': {
        xiaoyuzhou: 19,
        lizhi: 21,
        ximalaya: 65,
        wangyiyun: 1,
        youtube: 0,
      },
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 52,
        lizhi: 33,
        ximalaya: 61,
        wangyiyun: 10,
        youtube: 0,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 85,
        lizhi: 33,
        ximalaya: 78,
        wangyiyun: 35,
        youtube: 0,
      },
    },
    createdAt: '2026-03-16T13:58:53.352Z',
  },
  {
    id: 'snapshot-1773760665803',
    date: '2026-03-17',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 163,
      lizhi: 112,
      ximalaya: 206,
      wangyiyun: 56,
      youtube: 1,
    },
    episodePlays: {
      '69b184e184bce022f9f4fd5b': {
        xiaoyuzhou: 25,
        lizhi: 24,
        ximalaya: 67,
        wangyiyun: 4,
        youtube: 1,
      },
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 52,
        lizhi: 44,
        ximalaya: 61,
        wangyiyun: 15,
        youtube: 0,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 86,
        lizhi: 44,
        ximalaya: 78,
        wangyiyun: 37,
        youtube: 0,
      },
    },
    createdAt: '2026-03-17T15:17:45.803Z',
  },
  {
    id: 'snapshot-1773890529976',
    date: '2026-03-19',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 223,
      lizhi: 136,
      ximalaya: 244,
      wangyiyun: 71,
    },
    episodePlays: {
      '69bab249690ca3160f393dc7': {
        xiaoyuzhou: 26,
        lizhi: 0,
        ximalaya: 29,
        wangyiyun: 8,
      },
      '69b184e184bce022f9f4fd5b': {
        xiaoyuzhou: 41,
        lizhi: 35,
        ximalaya: 70,
        wangyiyun: 10,
      },
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 64,
        lizhi: 51,
        ximalaya: 65,
        wangyiyun: 15,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 92,
        lizhi: 50,
        ximalaya: 80,
        wangyiyun: 38,
      },
    },
    createdAt: '2026-03-19T03:22:09.976Z',
  },
  {
    id: 'snapshot-1774142698726',
    date: '2026-03-22',
    note: '自动抓取',
    platformTotals: {
      xiaoyuzhou: 305,
      lizhi: 192,
      ximalaya: 305,
      wangyiyun: 84,
    },
    episodePlays: {
      '69bc120a3c625cc5ae2f5160': {
        xiaoyuzhou: 24,
        lizhi: 2,
        ximalaya: 60,
        wangyiyun: 4,
      },
      '69bab249690ca3160f393dc7': {
        xiaoyuzhou: 47,
        lizhi: 4,
        ximalaya: 29,
        wangyiyun: 15,
      },
      '69b184e184bce022f9f4fd5b': {
        xiaoyuzhou: 57,
        lizhi: 55,
        ximalaya: 70,
        wangyiyun: 10,
      },
      '69ad0f7dc8cdeb38c26acb2c': {
        xiaoyuzhou: 76,
        lizhi: 67,
        ximalaya: 65,
        wangyiyun: 15,
      },
      '69a69588de29766da93ec01b': {
        xiaoyuzhou: 101,
        lizhi: 64,
        ximalaya: 81,
        wangyiyun: 40,
      },
    },
    createdAt: '2026-03-22T01:24:58.726Z',
  },
];

type Snapshot = (typeof fallbackSnapshots)[number];

async function loadSnapshots(): Promise<Snapshot[]> {
  try {
    const raw = await readFile(TRACKER_SNAPSHOTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return fallbackSnapshots;
    }

    return parsed;
  } catch {
    return fallbackSnapshots;
  }
}

async function loadEpisodes() {
  const response = await fetch(config.rssUrl, {
    headers: {
      'user-agent': 'ka21-podcast-dashboard/1.0',
      accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    next: { revalidate: 3600 },
  });

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
    const [episodes, snapshots] = await Promise.all([loadEpisodes(), loadSnapshots()]);
    return NextResponse.json({ config, episodes, snapshots });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'dashboard_load_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
