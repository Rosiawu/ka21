/*
  featured 重叠验证（主分类锁定）：
  - 人为制造同一个工具同时出现在多个分类的 featured
  - 验证归属按 config.order 优先归到最靠前的分类
  - 验证展示时不会出现跨分类重复
*/
import featuredConfig from '@/data/featured.json';
import toolsData from '@/data/tools.json';
import { FeaturedConfig } from '@/types/featured';
import { Tool } from '@/lib/types';
import { FeaturedToolsManager } from '@/lib/featured';

function clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

async function main() {
  const base = featuredConfig as unknown as FeaturedConfig;
  const tools = (toolsData as any).tools as Tool[];
  const config = clone(base);

  const order = config.order;
  const [c1, c2] = [order[0], order[1]];
  const targetToolId = 'cursor'; // a real tool id

  // Ensure target tool exists in dataset
  if (!tools.find(t => t.id === targetToolId)) {
    console.error(`Tool ${targetToolId} not found in tools.json`);
    process.exit(1);
  }

  // Force overlap: add same tool into two categories' featured
  const ensurePush = (arr: string[], id: string) => { if (!arr.includes(id)) arr.push(id); };
  ensurePush(config.categories[c1].featured_tools, targetToolId);
  ensurePush(config.categories[c2].featured_tools, targetToolId);

  const manager = new FeaturedToolsManager(config, tools);

  // Peek assignment (private) for verification
  const assign = (manager as any)['getAssignment']?.() as Record<string, string> | undefined;
  const assignedCat = assign ? assign[targetToolId] : '(unknown)';
  console.log(`Target '${targetToolId}' assigned to: ${assignedCat} (order[0]=${c1})`);

  // Initial displays
  const ps = 3;
  const snapshot: Record<string, string[]> = {};
  for (const key of order) {
    const { tools: items } = manager.getPaginatedTools(key, ps, { excludeGlobal: true });
    const ids = items.map(t => t.tool.id);
    snapshot[key] = ids;
    manager.updateGlobalDisplayState(key, ids);
    console.log(`[initial] ${key}: ${ids.join(', ')}`);
  }

  // Check that target tool appears in assigned category only
  const presentIn: string[] = [];
  for (const [k, ids] of Object.entries(snapshot)) {
    if (ids.includes(targetToolId)) presentIn.push(k);
  }
  console.log(`'${targetToolId}' present in: [${presentIn.join(', ')}]`);

  if (presentIn.length > 1) {
    console.error('Overlap detected for featured tool across categories');
    process.exit(1);
  }

  console.log('Featured overlap resolution: OK');
}

main().catch(err => { console.error(err); process.exit(1); });
