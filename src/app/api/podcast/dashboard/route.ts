import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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

const snapshots = [
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
];

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
    const episodes = await loadEpisodes();
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
