/**
 * 加载 .env.local 中的环境变量（仅对 process.env 中尚未设置的 key 生效）
 * Next.js 在开发/构建时会自动加载，但脚本环境需要手动调用此函数。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      // 去掉首尾引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local 不存在时静默跳过，依赖已有 process.env
  }
}
