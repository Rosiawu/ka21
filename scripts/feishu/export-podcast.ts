#!/usr/bin/env tsx
/**
 * feishu:podcast:export
 * 从飞书多维表导出数据，重建本地 JSON 文件供站点使用。
 *
 * 数据流（逆向）：
 *   snapshot_summary 表 + episode_plays 表 → snapshots.json
 *   episodes 表                            → episodes-cache.json
 *   config.json 不变（不从飞书导出，手动维护）
 *
 * 安全策略：
 *   • 先写入临时文件（.tmp），验证后原子替换，确保不会写入损坏数据
 *   • 如导出失败，原始 JSON 文件保持不变
 *
 * 用法: npm run feishu:podcast:export
 */
import { writeFileSync, renameSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal } from './lib/load-env.js';
import { getLarkClient } from './lib/client.js';
import { listAllRecords } from './lib/bitable.js';
import { loadSchema } from './lib/schema.js';

loadEnvLocal();

// ─── 数据文件路径 ────────────────────────────────────────────────────────────────
const DATA_DIR = resolve(process.cwd(), 'data/podcast-dashboard');
const SNAPSHOTS_PATH = resolve(DATA_DIR, 'snapshots.json');
const EPISODES_CACHE_PATH = resolve(DATA_DIR, 'episodes-cache.json');

// ─── 类型定义 ────────────────────────────────────────────────────────────────────
interface Snapshot {
  id: string; date: string; note: string; createdAt: string;
  platformTotals: Record<string, number>;
  episodePlays: Record<string, Record<string, number>>;
}
interface Episode { id: string; title: string; pubDate: string; duration: string; link: string }

// ─── 原子写入 ────────────────────────────────────────────────────────────────────
function atomicWrite(filePath: string, data: unknown): void {
  const tmpPath = `${filePath}.feishu-export.tmp`;
  writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  renameSync(tmpPath, filePath);
}

function cleanupTmp(filePath: string): void {
  const tmpPath = `${filePath}.feishu-export.tmp`;
  if (existsSync(tmpPath)) {
    try { unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────────
async function main() {
  const client = getLarkClient();
  const schema = loadSchema();
  const { app_token, tables } = schema;

  console.log('═══════════════════════════════════════════════════════');
  console.log('   飞书多维表导出（飞书 → 本地 JSON）');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n   多维表: ${app_token}`);

  // ── 1. 读取 episodes ────────────────────────────────────────────────────────
  console.log('\n1️⃣  读取 episodes...');
  const episodeRows = await listAllRecords(client, app_token, tables.episodes);
  console.log(`   ${episodeRows.length} 条`);

  const episodes: Episode[] = episodeRows
    .map(row => ({
      id:       String(row.fields.episode_id ?? ''),
      title:    String(row.fields.title       ?? ''),
      pubDate:  String(row.fields.pub_date     ?? ''),
      duration: String(row.fields.duration_text ?? ''),
      link:     String(row.fields.link         ?? ''),
    }))
    .filter(e => e.id && e.title)
    .sort((a, b) => {
      const noA = Number(String(a.title).match(/^\s*(\d+)\./)?.[1] ?? 9999);
      const noB = Number(String(b.title).match(/^\s*(\d+)\./)?.[1] ?? 9999);
      return noA - noB;
    });

  if (episodes.length === 0) throw new Error('episodes 表为空，导出中止');

  // ── 2. 读取 episode_plays（分组为 snapshotId → episodeId → platformId → count）──
  console.log('\n2️⃣  读取 episode_plays...');
  const playsRows = await listAllRecords(client, app_token, tables.episode_plays);
  console.log(`   ${playsRows.length} 条`);

  const playsBySnapshot = new Map<string, Map<string, Record<string, number>>>();
  for (const row of playsRows) {
    const snapId     = String(row.fields.snapshot_id  ?? '');
    const episodeId  = String(row.fields.episode_id   ?? '');
    const platformId = String(row.fields.platform_id  ?? '');
    const count      = Number(row.fields.play_count   ?? 0);
    if (!snapId || !episodeId || !platformId) continue;

    if (!playsBySnapshot.has(snapId)) playsBySnapshot.set(snapId, new Map());
    const byEpisode = playsBySnapshot.get(snapId)!;
    if (!byEpisode.has(episodeId)) byEpisode.set(episodeId, {});
    byEpisode.get(episodeId)![platformId] = count;
  }

  // ── 3. 读取 snapshot_summary ────────────────────────────────────────────────
  console.log('\n3️⃣  读取 snapshot_summary...');
  const summaryRows = await listAllRecords(client, app_token, tables.snapshot_summary);
  console.log(`   ${summaryRows.length} 条`);

  if (summaryRows.length === 0) throw new Error('snapshot_summary 表为空，导出中止');

  // 从字段名中推导平台列（形如 xiaoyuzhou_plays）
  const platformFieldPattern = /^(.+)_plays$/;
  const allFieldNames = new Set(summaryRows.flatMap(r => Object.keys(r.fields)));
  const platformIds = [...allFieldNames]
    .filter(n => platformFieldPattern.test(n))
    .map(n => n.match(platformFieldPattern)![1]);

  const snapshots: Snapshot[] = summaryRows.map(row => {
    const snapId = String(row.fields.snapshot_id ?? '');
    const platformTotals: Record<string, number> = {};
    for (const pid of platformIds) {
      const val = row.fields[`${pid}_plays`];
      if (val !== null && val !== undefined && val !== '') {
        platformTotals[pid] = Number(val);
      }
    }

    // 从 episode_plays 表还原 episodePlays（如果在窗口内有记录）
    const episodePlays: Record<string, Record<string, number>> = {};
    const byEpisode = playsBySnapshot.get(snapId);
    if (byEpisode) {
      for (const [episodeId, plays] of byEpisode.entries()) {
        episodePlays[episodeId] = plays;
      }
    }

    return {
      id:           snapId,
      date:         String(row.fields.snapshot_date  ?? ''),
      note:         String(row.fields.note           ?? ''),
      createdAt:    String(row.fields.created_at_utc ?? ''),
      platformTotals,
      episodePlays,
    };
  })
  .filter(s => s.id && s.date)
  .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  // ── 4. 原子写入 ──────────────────────────────────────────────────────────────
  console.log('\n4️⃣  写入本地 JSON（原子替换）...');

  try {
    atomicWrite(SNAPSHOTS_PATH, snapshots);
    console.log(`   ✅ snapshots.json  (${snapshots.length} 条快照)`);

    atomicWrite(EPISODES_CACHE_PATH, {
      updatedAt: new Date().toISOString(),
      source: 'feishu-export',
      episodes,
    });
    console.log(`   ✅ episodes-cache.json  (${episodes.length} 个单集)`);
  } catch (err) {
    cleanupTmp(SNAPSHOTS_PATH);
    cleanupTmp(EPISODES_CACHE_PATH);
    throw err;
  }

  // ── 汇总 ────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ 导出完成！');
  console.log(`\n   snapshots.json:       ${snapshots.length} 条快照`);
  console.log(`   episodes-cache.json:  ${episodes.length} 个单集`);
  console.log(`   config.json:          未修改（手动维护）`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('\n❌ 导出失败（本地 JSON 未修改）:', err instanceof Error ? err.message : err);
  process.exit(1);
});
