#!/usr/bin/env tsx
/**
 * feishu:podcast:sync
 * 把本地播客 JSON 数据幂等地同步到飞书多维表。
 *
 * 数据流：
 *   data/podcast-dashboard/config.json      → platforms 表
 *   data/podcast-dashboard/episodes-cache.json → episodes 表
 *   data/podcast-dashboard/snapshots.json   → snapshot_summary 表 + episode_plays 表
 *
 * 限制策略：
 *   • episode_plays 只保留最近 180 天的快照数据，且总行数不超过 12000 行
 *   • 同步失败时立即抛出错误，不修改本地 JSON
 *
 * 用法: npm run feishu:podcast:sync
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal } from './lib/load-env.js';
import { getLarkClient } from './lib/client.js';
import { batchUpsert, deleteStaleRecords } from './lib/bitable.js';
import { loadSchema } from './lib/schema.js';

loadEnvLocal();

// ─── 数据文件路径 ────────────────────────────────────────────────────────────────
const ROOT = resolve(process.cwd());
const DATA_DIR = resolve(ROOT, 'data/podcast-dashboard');

// ─── 播客数据类型 ────────────────────────────────────────────────────────────────
interface Platform { id: string; name: string; url: string }
interface PodcastConfig { showName: string; rssUrl: string; platforms: Platform[] }
interface Episode { id: string; title: string; pubDate: string; duration: string; link: string }
interface EpisodesCache { episodes: Episode[] }
interface Snapshot {
  id: string; date: string; note: string; createdAt: string;
  platformTotals: Record<string, number>;
  episodePlays: Record<string, Record<string, number>>;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────────

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function parseEpisodeNo(title: string): number | null {
  const m = String(title || '').match(/^\s*(\d+)\./);
  return m ? Number(m[1]) : null;
}

function parseDurationSeconds(duration: string): number | null {
  if (!duration) return null;
  const parts = duration.split(':');
  if (parts.length !== 3) return null;
  const [h, m, s] = parts.map(Number);
  if ([h, m, s].some(v => !Number.isFinite(v))) return null;
  return h * 3600 + m * 60 + s;
}

/** 计算 180 天前的日期字符串（ISO date 格式） */
function cutoffDate(daysAgo = 180): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────────

async function main() {
  const client = getLarkClient();
  const schema = loadSchema();
  const { app_token, tables } = schema;

  console.log('═══════════════════════════════════════════════════════');
  console.log('   飞书多维表同步（本地 JSON → 飞书）');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n   多维表: ${app_token}`);

  // ── 读取本地数据 ────────────────────────────────────────────────────────────
  console.log('\n📂 正在读取本地数据...');
  const config = readJson<PodcastConfig>(resolve(DATA_DIR, 'config.json'));
  const episodesCache = readJson<EpisodesCache>(resolve(DATA_DIR, 'episodes-cache.json'));
  const snapshots = readJson<Snapshot[]>(resolve(DATA_DIR, 'snapshots.json'));

  const platformIds = config.platforms.map(p => p.id);
  const episodeMap = new Map(episodesCache.episodes.map(e => [e.id, e]));
  const platformMap = new Map(config.platforms.map(p => [p.id, p]));

  console.log(`   platforms: ${config.platforms.length} 条`);
  console.log(`   episodes:  ${episodesCache.episodes.length} 条`);
  console.log(`   snapshots: ${snapshots.length} 条`);

  // ── 同步 platforms ──────────────────────────────────────────────────────────
  console.log('\n1️⃣  同步 platforms...');
  const platformRecords = config.platforms.map(p => ({
    externalKey: `platform:${p.id}`,
    fields: {
      platform_id:   p.id,
      platform_name: p.name,
      platform_url:  p.url,
    },
  }));
  const r1 = await batchUpsert(client, app_token, tables.platforms, platformRecords);
  console.log(`   ✅ 新增 ${r1.created} 条，更新 ${r1.updated} 条`);

  // ── 同步 episodes ───────────────────────────────────────────────────────────
  console.log('\n2️⃣  同步 episodes...');
  const episodeRecords = episodesCache.episodes.map(e => ({
    externalKey: `episode:${e.id}`,
    fields: {
      episode_id:       e.id,
      episode_no:       parseEpisodeNo(e.title),
      title:            e.title,
      pub_date:         e.pubDate,
      duration_text:    e.duration,
      duration_seconds: parseDurationSeconds(e.duration),
      link:             e.link,
    },
  }));
  const r2 = await batchUpsert(client, app_token, tables.episodes, episodeRecords);
  console.log(`   ✅ 新增 ${r2.created} 条，更新 ${r2.updated} 条`);

  // ── 同步 snapshot_summary ───────────────────────────────────────────────────
  console.log('\n3️⃣  同步 snapshot_summary...');
  const summaryRecords = snapshots.map(s => {
    const total = Object.values(s.platformTotals || {}).reduce((a, b) => a + Number(b), 0);
    return {
      externalKey: `snapshot:${s.id}`,
      fields: {
        snapshot_id:         s.id,
        snapshot_date:       s.date,
        note:                s.note ?? '',
        created_at_utc:      s.createdAt,
        total_all_platforms: total,
        ...Object.fromEntries(
          platformIds.map(id => [`${id}_plays`, s.platformTotals[id] ?? null]),
        ),
      },
    };
  });
  const r3 = await batchUpsert(client, app_token, tables.snapshot_summary, summaryRecords);
  console.log(`   ✅ 新增 ${r3.created} 条，更新 ${r3.updated} 条`);

  // ── 同步 episode_plays（滚动窗口：最近 180 天，最多 12000 行）──────────────
  console.log('\n4️⃣  同步 episode_plays（最近 180 天）...');
  const cutoff = cutoffDate(180);
  const MAX_PLAYS_ROWS = 12000;

  const playsRecords: Array<{ externalKey: string; fields: Record<string, unknown> }> = [];
  const keepKeys = new Set<string>();

  // 按日期降序处理（最新优先），保证优先保留最新数据
  const sortedSnapshots = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));

  for (const snap of sortedSnapshots) {
    if (snap.date < cutoff) continue;
    if (playsRecords.length >= MAX_PLAYS_ROWS) break;

    for (const [episodeId, platformPlays] of Object.entries(snap.episodePlays || {})) {
      for (const [platformId, playCount] of Object.entries(platformPlays)) {
        if (playsRecords.length >= MAX_PLAYS_ROWS) break;
        const key = `play:${snap.id}:${episodeId}:${platformId}`;
        keepKeys.add(key);
        playsRecords.push({
          externalKey: key,
          fields: {
            snapshot_id:    snap.id,
            snapshot_date:  snap.date,
            created_at_utc: snap.createdAt,
            episode_id:     episodeId,
            episode_no:     parseEpisodeNo(episodeMap.get(episodeId)?.title ?? ''),
            episode_title:  episodeMap.get(episodeId)?.title ?? episodeId,
            platform_id:    platformId,
            platform_name:  platformMap.get(platformId)?.name ?? platformId,
            play_count:     Number(playCount),
          },
        });
      }
    }
  }

  const r4 = await batchUpsert(client, app_token, tables.episode_plays, playsRecords);
  console.log(`   ✅ 新增 ${r4.created} 条，更新 ${r4.updated} 条，共 ${r4.total} 行（窗口内）`);

  // 清理过期记录（180 天窗口之外的）
  const deleted = await deleteStaleRecords(client, app_token, tables.episode_plays, keepKeys);
  if (deleted > 0) console.log(`   🧹 已清理 ${deleted} 条过期记录`);

  // ── 汇总 ────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ 同步完成！');
  console.log(`\n   platforms:        ${r1.total} 行`);
  console.log(`   episodes:         ${r2.total} 行`);
  console.log(`   snapshot_summary: ${r3.total} 行`);
  console.log(`   episode_plays:    ${r4.total} 行（${playsRecords.length} 行同步中）`);
  console.log(`\n   下一步: npm run feishu:podcast:export`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('\n❌ 同步失败（本地 JSON 未修改）:', err instanceof Error ? err.message : err);
  process.exit(1);
});
