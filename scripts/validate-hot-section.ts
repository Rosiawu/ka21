/*
  热门板块验证脚本（全局去重 + 主分类锁定）
  - 读取 featured.json / tools.json
  - 模拟首屏与多轮刷新，检查三分类是否有跨分类重复
  - 打印未满页（underfill）情况
  - 采样性能（avg 与 p95）
*/
import featuredConfig from '@/data/featured.json';
import toolsData from '@/data/tools.json';
import { FeaturedConfig } from '@/types/featured';
import { Tool } from '@/lib/types';
import { FeaturedToolsManager, getPageSize } from '@/lib/featured';

// 检查是否存在跨分类重复的工具ID
function hasOverlap(groups: Record<string, string[]>): { overlap: boolean; detail: string } {
  const seen = new Map<string, string>();
  for (const [cat, ids] of Object.entries(groups)) {
    for (const id of ids) {
      if (seen.has(id)) {
        return { overlap: true, detail: `${id} in ${seen.get(id)} and ${cat}` };
      }
      seen.set(id, cat);
    }
  }
  return { overlap: false, detail: '' };
}

// 简单计时器
function time<T>(fn: () => T): { result: T; ms: number } {
  const start = Date.now();
  const result = fn();
  const ms = Date.now() - start;
  return { result, ms };
}

// 计算 P95
function p95(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(0.95 * (sorted.length - 1));
  return sorted[idx];
}

async function runSuite(pageSize: number) {
  const config = featuredConfig as unknown as FeaturedConfig;
  const tools = (toolsData as any).tools as Tool[];
  const manager = new FeaturedToolsManager(config, tools);
  console.log(`\n=== Suite: pageSize=${pageSize} ===`);

  // Initial pass per category
  const step1: Record<string, string[]> = {};
  for (const key of config.order) {
    const { tools: items } = manager.getPaginatedTools(key, pageSize, { excludeGlobal: true });
    const ids = items.map(t => t.tool.id);
    step1[key] = ids;
    manager.updateGlobalDisplayState(key, ids);
    console.log(`[initial] ${key}: ${ids.join(', ')}`);
    if (ids.length < pageSize) {
      console.log(`[underfill] ${key} displayed ${ids.length}/${pageSize}`);
    }
  }
  let { overlap, detail } = hasOverlap(step1);
  console.log(`[initial] overlap=${overlap}${overlap ? ` (${detail})` : ''}`);

  // Round-robin refreshes
  const rounds = 3;
  for (let r = 1; r <= rounds; r++) {
    const snapshot: Record<string, string[]> = {};
    for (const key of config.order) {
      const { tools: items } = manager.refreshCategory(key, pageSize);
      const ids = items.map(t => t.tool.id);
      snapshot[key] = ids;
      console.log(`[refresh ${r}] ${key}: ${ids.join(', ')}`);
      if (ids.length < pageSize) {
        console.log(`[underfill] ${key} displayed ${ids.length}/${pageSize}`);
      }
    }
    const check = hasOverlap(snapshot);
    console.log(`[refresh ${r}] overlap=${check.overlap}${check.overlap ? ` (${check.detail})` : ''}`);
  }

  // Performance micro-benchmark: random refresh 100 times
  const durations: number[] = [];
  for (let i = 0; i < 100; i++) {
    const key = config.order[i % config.order.length];
    const { ms } = time(() => manager.refreshCategory(key, pageSize));
    durations.push(ms);
  }
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  console.log(`[perf] avg=${avg}ms, p95=${p95(durations)}ms over ${durations.length} runs`);
}

async function main() {
  // Use current getPageSize plus variants
  const sizes = [2, getPageSize(), 4, 10, 50];
  for (const size of sizes) {
    await runSuite(size);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
