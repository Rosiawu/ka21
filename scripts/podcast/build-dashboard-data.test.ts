import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDashboardData } from './build-dashboard-data';

const config = {
  showName: '灯下白',
  rssUrl: 'https://example.com/feed.xml',
  platforms: [{ id: 'example', name: 'Example', url: 'https://example.com' }],
};

const episodeCache = {
  updatedAt: '2026-11-20T21:48:16.627Z',
  source: 'example',
  episodes: [
    {
      id: 'episode-1',
      title: 'Episode 1',
      pubDate: '2026-11-20T00:00:00.000Z',
      duration: '60',
      link: 'https://example.com/episode-1',
    },
  ],
};

const snapshots = [
  {
    id: 'snapshot-1',
    date: '2026-11-21',
    note: '自动抓取',
    platformTotals: { example: 1 },
    episodePlays: { 'episode-1': { example: 1 } },
    createdAt: '2026-11-21T00:00:00.000Z',
  },
];

test('buildDashboardData preserves source-of-truth arrays and records provenance', () => {
  const result = buildDashboardData(config, episodeCache, snapshots);

  assert.equal(result.episodes, episodeCache.episodes);
  assert.equal(result.snapshots, snapshots);
  assert.deepEqual(result.config, config);
  assert.deepEqual(result.generatedFrom, {
    episodeCacheUpdatedAt: episodeCache.updatedAt,
    latestSnapshotDate: '2026-11-21',
  });
});

test('buildDashboardData refuses to publish an empty snapshot history', () => {
  assert.throws(
    () => buildDashboardData(config, episodeCache, []),
    /snapshots are empty/,
  );
});
