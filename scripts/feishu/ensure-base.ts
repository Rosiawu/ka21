#!/usr/bin/env tsx
/**
 * feishu:podcast:ensure-base
 * 幂等地在飞书创建/验证播客仪表板所需的多维表结构：
 *   • platforms        — 平台维表
 *   • episodes         — 单集维表
 *   • snapshot_summary — 每日快照汇总
 *   • episode_plays    — 单集播放明细
 *
 * 运行后生成 scripts/feishu/schema.json 并提示将 FEISHU_BASE_TOKEN 写入 .env.local。
 * 用法: npm run feishu:podcast:ensure-base
 */
import { loadEnvLocal } from './lib/load-env.js';
import { getLarkClient } from './lib/client.js';
import { FieldType, createBase, getBase, listTables, createTable } from './lib/bitable.js';
import { saveSchema, schemaExists, loadSchema, type FeishuSchema } from './lib/schema.js';
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnvLocal();

// ─── 各表的字段定义 ─────────────────────────────────────────────────────────────
// external_key 必须是第一个字段（会成为主字段）

const TABLE_DEFS = {
  platforms: [
    { field_name: 'external_key',  type: FieldType.TEXT   },
    { field_name: 'platform_id',   type: FieldType.TEXT   },
    { field_name: 'platform_name', type: FieldType.TEXT   },
    { field_name: 'platform_url',  type: FieldType.TEXT   },
  ],
  episodes: [
    { field_name: 'external_key',     type: FieldType.TEXT   },
    { field_name: 'episode_id',       type: FieldType.TEXT   },
    { field_name: 'episode_no',       type: FieldType.NUMBER },
    { field_name: 'title',            type: FieldType.TEXT   },
    { field_name: 'pub_date',         type: FieldType.TEXT   },
    { field_name: 'duration_text',    type: FieldType.TEXT   },
    { field_name: 'duration_seconds', type: FieldType.NUMBER },
    { field_name: 'link',             type: FieldType.TEXT   },
  ],
  snapshot_summary: [
    { field_name: 'external_key',        type: FieldType.TEXT   },
    { field_name: 'snapshot_id',         type: FieldType.TEXT   },
    { field_name: 'snapshot_date',       type: FieldType.TEXT   },
    { field_name: 'note',                type: FieldType.TEXT   },
    { field_name: 'created_at_utc',      type: FieldType.TEXT   },
    { field_name: 'total_all_platforms', type: FieldType.NUMBER },
    { field_name: 'xiaoyuzhou_plays',    type: FieldType.NUMBER },
    { field_name: 'apple_plays',         type: FieldType.NUMBER },
    { field_name: 'lizhi_plays',         type: FieldType.NUMBER },
    { field_name: 'ximalaya_plays',      type: FieldType.NUMBER },
    { field_name: 'wangyiyun_plays',     type: FieldType.NUMBER },
    { field_name: 'qingting_plays',      type: FieldType.NUMBER },
    { field_name: 'youtube_plays',       type: FieldType.NUMBER },
    { field_name: 'spotify_plays',       type: FieldType.NUMBER },
  ],
  episode_plays: [
    { field_name: 'external_key',   type: FieldType.TEXT   },
    { field_name: 'snapshot_id',    type: FieldType.TEXT   },
    { field_name: 'snapshot_date',  type: FieldType.TEXT   },
    { field_name: 'created_at_utc', type: FieldType.TEXT   },
    { field_name: 'episode_id',     type: FieldType.TEXT   },
    { field_name: 'episode_no',     type: FieldType.NUMBER },
    { field_name: 'episode_title',  type: FieldType.TEXT   },
    { field_name: 'platform_id',    type: FieldType.TEXT   },
    { field_name: 'platform_name',  type: FieldType.TEXT   },
    { field_name: 'play_count',     type: FieldType.NUMBER },
  ],
} as const;

type TableName = keyof typeof TABLE_DEFS;
const TABLE_NAMES = Object.keys(TABLE_DEFS) as TableName[];

// ─── 主流程 ──────────────────────────────────────────────────────────────────────

async function main() {
  const client = getLarkClient();

  console.log('═══════════════════════════════════════════════════════');
  console.log('   飞书多维表结构初始化 / 验证');
  console.log('═══════════════════════════════════════════════════════');

  // ── 1. 确定 app_token ──────────────────────────────────────────────────────
  let appToken = process.env.FEISHU_BASE_TOKEN?.trim() ?? '';

  // 也可以从已有 schema.json 中读取
  if (!appToken && schemaExists()) {
    try {
      appToken = loadSchema().app_token;
      console.log(`\n📋 从 schema.json 读取到 app_token: ${appToken}`);
    } catch {
      // schema.json 损坏，忽略
    }
  }

  // ── 2. 验证或创建多维表 ────────────────────────────────────────────────────
  if (appToken) {
    console.log(`\n🔍 正在验证已有多维表 (${appToken})...`);
    try {
      const base = await getBase(client, appToken);
      console.log(`✅ 多维表可访问：${base.name}`);
    } catch {
      console.warn('⚠️  无法访问已有多维表，将重新创建...');
      appToken = '';
    }
  }

  if (!appToken) {
    console.log('\n✨ 正在创建新的飞书多维表 "KA21 Podcast Dashboard"...');
    appToken = await createBase(client, 'KA21 Podcast Dashboard');
    console.log(`✅ 多维表创建成功，app_token: ${appToken}`);
  }

  // ── 3. 确保各数据表存在 ────────────────────────────────────────────────────
  console.log('\n📊 正在检查数据表...');
  const existingTables = await listTables(client, appToken);

  const schema: FeishuSchema = {
    app_token: appToken,
    tables: { platforms: '', episodes: '', snapshot_summary: '', episode_plays: '' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  for (const tableName of TABLE_NAMES) {
    if (existingTables[tableName]) {
      console.log(`   ✓ ${tableName}  (${existingTables[tableName]})`);
      schema.tables[tableName] = existingTables[tableName];
    } else {
      process.stdout.write(`   + 创建 ${tableName} ...`);
      const tableId = await createTable(client, appToken, tableName, [...TABLE_DEFS[tableName]]);
      schema.tables[tableName] = tableId;
      console.log(` ✅ (${tableId})`);
    }
  }

  // ── 4. 清理 Feishu 自动创建的示例表（如"数据表1"）────────────────────────
  const sampleTables = Object.entries(existingTables).filter(
    ([name]) => !TABLE_NAMES.includes(name as TableName),
  );
  if (sampleTables.length > 0) {
    console.log(`\n🧹 检测到 ${sampleTables.length} 个示例表（${sampleTables.map(([n]) => n).join(', ')}）`);
    console.log('   如需删除可手动在飞书多维表界面操作。');
  }

  // ── 5. 写入 schema.json ────────────────────────────────────────────────────
  saveSchema(schema);
  console.log(`\n💾 schema.json 已写入 scripts/feishu/schema.json`);

  // ── 6. 提示写入 .env.local ─────────────────────────────────────────────────
  const envPath = resolve(process.cwd(), '.env.local');
  let envContent = '';
  try { envContent = readFileSync(envPath, 'utf-8'); } catch { /* 不存在 */ }

  if (!envContent.includes('FEISHU_BASE_TOKEN')) {
    appendFileSync(envPath, `\nFEISHU_BASE_TOKEN=${appToken}\n`);
    console.log(`✅ FEISHU_BASE_TOKEN 已追加到 .env.local`);
  } else {
    console.log(`ℹ️  FEISHU_BASE_TOKEN 已在 .env.local 中（如需更新请手动修改）`);
  }

  // ── 7. 汇总 ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ 多维表结构就绪！');
  console.log(`\n   多维表: KA21 Podcast Dashboard`);
  console.log(`   app_token: ${appToken}`);
  console.log(`\n   下一步:`);
  console.log(`     npm run feishu:podcast:sync    # 同步本地 JSON 到飞书`);
  console.log(`     npm run feishu:podcast:export  # 从飞书导出 JSON`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
