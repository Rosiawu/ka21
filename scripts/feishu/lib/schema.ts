/**
 * 飞书多维表 Schema 映射文件管理
 * schema.json 由 ensure-base 脚本自动生成，记录 app_token 和各表的 table_id。
 * 该文件已加入 .gitignore，不会提交到仓库。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SCHEMA_PATH = resolve(process.cwd(), 'scripts/feishu/schema.json');

export interface FeishuSchema {
  /** 飞书多维表的 app_token，格式如 bascXXXXXXXXXXXX */
  app_token: string;
  /** 各数据表的 table_id 映射 */
  tables: {
    platforms: string;
    episodes: string;
    snapshot_summary: string;
    episode_plays: string;
  };
  created_at: string;
  updated_at: string;
}

export function loadSchema(): FeishuSchema {
  if (!existsSync(SCHEMA_PATH)) {
    throw new Error(
      `❌ schema.json 不存在，请先运行：\n   npm run feishu:podcast:ensure-base`,
    );
  }
  return JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as FeishuSchema;
}

export function saveSchema(schema: FeishuSchema): void {
  writeFileSync(SCHEMA_PATH, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
}

export function schemaExists(): boolean {
  return existsSync(SCHEMA_PATH);
}
