import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type PodcastConfig = {
  showName: string;
  rssUrl: string;
  platforms: ReadonlyArray<Record<string, unknown>>;
};

type Episode = {
  id: string;
  title: string;
  pubDate: string;
  duration: string;
  link: string;
};

type EpisodeCache = {
  updatedAt: string;
  source: string;
  episodes: Episode[];
};

type Snapshot = {
  id: string;
  date: string;
  note: string;
  platformTotals: Record<string, number>;
  episodePlays: Record<string, Record<string, number>>;
  createdAt: string;
};

export function buildDashboardData(
  config: PodcastConfig,
  episodeCache: EpisodeCache,
  snapshots: Snapshot[],
) {
  if (!config.showName || !config.rssUrl || !Array.isArray(config.platforms) || config.platforms.length === 0) {
    throw new Error('Podcast dashboard config is incomplete');
  }

  if (!Array.isArray(episodeCache.episodes) || episodeCache.episodes.length === 0) {
    throw new Error('Podcast dashboard episode cache is empty');
  }

  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    throw new Error('Podcast dashboard snapshots are empty');
  }

  return {
    generatedFrom: {
      episodeCacheUpdatedAt: episodeCache.updatedAt,
      latestSnapshotDate: snapshots.at(-1)?.date,
    },
    config,
    episodes: episodeCache.episodes,
    snapshots,
  };
}

export async function generateDashboardData(rootDir = process.cwd()) {
  const dataDir = path.join(rootDir, 'data', 'podcast-dashboard');
  const outputPath = path.join(rootDir, 'public', 'podcast-dashboard', 'data.json');
  const [configSource, episodeSource, snapshotSource] = await Promise.all([
    readFile(path.join(dataDir, 'config.json'), 'utf8'),
    readFile(path.join(dataDir, 'episodes-cache.json'), 'utf8'),
    readFile(path.join(dataDir, 'snapshots.json'), 'utf8'),
  ]);

  const data = buildDashboardData(
    JSON.parse(configSource) as PodcastConfig,
    JSON.parse(episodeSource) as EpisodeCache,
    JSON.parse(snapshotSource) as Snapshot[],
  );

  await writeFile(outputPath, `${JSON.stringify(data)}\n`, 'utf8');
  return data;
}

const isMainModule = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isMainModule) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  generateDashboardData(rootDir)
    .then((data) => {
      console.log(
        `Generated podcast dashboard data: ${data.episodes.length} episodes, ${data.snapshots.length} snapshots, latest ${data.generatedFrom.latestSnapshotDate}`,
      );
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
