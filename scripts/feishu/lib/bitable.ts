/**
 * 飞书多维表（Bitable）底层操作封装
 * 所有业务脚本通过这里的函数访问 Feishu Bitable API。
 */
import * as lark from '@larksuiteoapi/node-sdk';

// ─── 常量 ──────────────────────────────────────────────────────────────────────

/** 字段类型枚举（Bitable field type） */
export const FieldType = {
  TEXT: 1,
  NUMBER: 2,
  DATE: 5,
} as const;

/** 每次批量读写的最大记录数（API 上限 500） */
const BATCH_SIZE = 500;

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export interface FieldDef {
  field_name: string;
  type: number;
  description?: string;
}

export interface RecordRow {
  record_id?: string;
  fields: Record<string, unknown>;
}

export interface UpsertResult {
  created: number;
  updated: number;
  total: number;
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function chunks<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

/** 简单的指数退避重试，处理临时限流 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

// ─── Base（多维表） ─────────────────────────────────────────────────────────────

/** 创建一个新的飞书多维表，返回 app_token */
export async function createBase(client: lark.Client, name: string): Promise<string> {
  const resp = await client.bitable.app.create({ data: { name, folder_token: '' } });
  if (resp.code !== 0) throw new Error(`创建多维表失败 (code=${resp.code}): ${resp.msg}`);
  const token = resp.data?.app?.app_token;
  if (!token) throw new Error('创建多维表成功但未返回 app_token');
  return token;
}

/** 获取多维表信息（验证 app_token 有效） */
export async function getBase(
  client: lark.Client,
  appToken: string,
): Promise<{ name: string; app_token: string }> {
  const resp = await client.bitable.app.get({ path: { app_token: appToken } });
  if (resp.code !== 0) throw new Error(`获取多维表失败 (code=${resp.code}): ${resp.msg}`);
  return {
    name: resp.data?.app?.name ?? '',
    app_token: resp.data?.app?.app_token ?? appToken,
  };
}

// ─── Table（数据表） ────────────────────────────────────────────────────────────

/** 列出多维表中所有数据表，返回 { name → table_id } 映射 */
export async function listTables(
  client: lark.Client,
  appToken: string,
): Promise<Record<string, string>> {
  const resp = await client.bitable.appTable.list({ path: { app_token: appToken }, params: { page_size: 100 } });
  if (resp.code !== 0) throw new Error(`列出数据表失败 (code=${resp.code}): ${resp.msg}`);
  const result: Record<string, string> = {};
  for (const t of resp.data?.items ?? []) {
    if (t.name && t.table_id) result[t.name] = t.table_id;
  }
  return result;
}

/**
 * 创建数据表（含字段定义）。
 * Feishu 创建表时会自动生成一个"标题"字段，我们把它重命名为第一个字段。
 * 剩余字段逐个创建。
 */
export async function createTable(
  client: lark.Client,
  appToken: string,
  tableName: string,
  fields: FieldDef[],
): Promise<string> {
  // 1. 创建表（不带 fields，避免兼容性问题）
  const createResp = await client.bitable.appTable.create({
    path: { app_token: appToken },
    data: { table: { name: tableName } },
  });
  if (createResp.code !== 0) {
    throw new Error(`创建数据表 "${tableName}" 失败 (code=${createResp.code}): ${createResp.msg}`);
  }
  const tableId = createResp.data?.table_id;
  if (!tableId) throw new Error(`创建数据表 "${tableName}" 成功但未返回 table_id`);

  // 2. 列出默认字段，找到系统自动创建的"标题"字段
  const fieldsResp = await client.bitable.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
    params: { page_size: 50 },
  });
  const defaultField = fieldsResp.data?.items?.[0];

  // 3. 把第一个字段（标题字段）重命名为 external_key
  const primaryField = fields[0];
  if (defaultField?.field_id) {
    await client.bitable.appTableField.update({
      path: { app_token: appToken, table_id: tableId, field_id: defaultField.field_id },
      data: { field_name: primaryField.field_name, type: primaryField.type },
    });
  }

  // 4. 创建剩余字段
  for (const field of fields.slice(1)) {
    await withRetry(() =>
      client.bitable.appTableField.create({
        path: { app_token: appToken, table_id: tableId },
        data: { field_name: field.field_name, type: field.type },
      }),
    );
    await new Promise(r => setTimeout(r, 100)); // 避免触发频控
  }

  return tableId;
}

// ─── Records（记录） ────────────────────────────────────────────────────────────

/**
 * 分页读取所有记录，只拉取 external_key 字段以节省流量。
 * 返回 external_key → record_id 的映射。
 */
export async function fetchExternalKeyMap(
  client: lark.Client,
  appToken: string,
  tableId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let pageToken: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.bitable.appTableRecord.list({
        path: { app_token: appToken, table_id: tableId },
        params: {
          page_size: BATCH_SIZE,
          ...(pageToken ? { page_token: pageToken } : {}),
          field_names: JSON.stringify(['external_key']),
        },
      }),
    );
    if (resp.code !== 0) throw new Error(`读取记录失败 (code=${resp.code}): ${resp.msg}`);

    for (const item of resp.data?.items ?? []) {
      const key = item.fields?.['external_key'];
      if (typeof key === 'string' && item.record_id) {
        map.set(key, item.record_id);
      }
    }
    pageToken = resp.data?.has_more ? (resp.data.page_token ?? undefined) : undefined;
  } while (pageToken);

  return map;
}

/**
 * 分页读取所有记录（含完整字段），用于导出。
 */
export async function listAllRecords(
  client: lark.Client,
  appToken: string,
  tableId: string,
): Promise<RecordRow[]> {
  const all: RecordRow[] = [];
  let pageToken: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.bitable.appTableRecord.list({
        path: { app_token: appToken, table_id: tableId },
        params: {
          page_size: BATCH_SIZE,
          ...(pageToken ? { page_token: pageToken } : {}),
        },
      }),
    );
    if (resp.code !== 0) throw new Error(`读取记录失败 (code=${resp.code}): ${resp.msg}`);

    for (const item of resp.data?.items ?? []) {
      all.push({ record_id: item.record_id, fields: (item.fields ?? {}) as Record<string, unknown> });
    }
    pageToken = resp.data?.has_more ? (resp.data.page_token ?? undefined) : undefined;
  } while (pageToken);

  return all;
}

/**
 * 幂等批量写入（upsert by external_key）。
 * 先读取全表的 external_key → record_id 映射，再分批创建/更新。
 */
export async function batchUpsert(
  client: lark.Client,
  appToken: string,
  tableId: string,
  records: Array<{ externalKey: string; fields: Record<string, unknown> }>,
): Promise<UpsertResult> {
  const existingMap = await fetchExternalKeyMap(client, appToken, tableId);

  const toCreate = records.filter(r => !existingMap.has(r.externalKey));
  const toUpdate = records.filter(r => existingMap.has(r.externalKey));

  // 批量创建
  for (const batch of chunks(toCreate, BATCH_SIZE)) {
    await withRetry(() =>
      client.bitable.appTableRecord.batchCreate({
        path: { app_token: appToken, table_id: tableId },
        data: {
          records: batch.map(r => ({ fields: { external_key: r.externalKey, ...r.fields } })),
        },
      }),
    );
    await new Promise(r => setTimeout(r, 200));
  }

  // 批量更新
  for (const batch of chunks(toUpdate, BATCH_SIZE)) {
    await withRetry(() =>
      client.bitable.appTableRecord.batchUpdate({
        path: { app_token: appToken, table_id: tableId },
        data: {
          records: batch.map(r => ({
            record_id: existingMap.get(r.externalKey)!,
            fields: { external_key: r.externalKey, ...r.fields },
          })),
        },
      }),
    );
    await new Promise(r => setTimeout(r, 200));
  }

  return { created: toCreate.length, updated: toUpdate.length, total: records.length };
}

/**
 * 删除 external_key 不在保留集合中的旧记录（用于 episode_plays 的滚动清理）。
 */
export async function deleteStaleRecords(
  client: lark.Client,
  appToken: string,
  tableId: string,
  keepKeys: Set<string>,
): Promise<number> {
  const all = await fetchExternalKeyMap(client, appToken, tableId);
  const toDelete = [...all.entries()]
    .filter(([key]) => !keepKeys.has(key))
    .map(([, recordId]) => recordId);

  for (const batch of chunks(toDelete, BATCH_SIZE)) {
    await withRetry(() =>
      client.bitable.appTableRecord.batchDelete({
        path: { app_token: appToken, table_id: tableId },
        data: { records: batch },
      }),
    );
    await new Promise(r => setTimeout(r, 200));
  }

  return toDelete.length;
}
