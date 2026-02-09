import type { Metadata, ResolvingMetadata } from 'next';

/**
 * 用于合并父级metadata（特别是icons）的工具函数
 * 确保子页面不会意外覆盖根layout的favicon设置
 * 
 * @param overrides 子页面想要覆盖的metadata字段
 * @param parent 父级metadata
 * @returns 合并后的metadata
 */
export async function withBaseMeta(
  overrides: Metadata,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const base = await parent;
  
  // 合并metadata，overrides会覆盖同名字段，但保留base中不存在于overrides的字段
  const result: Metadata = { 
    ...overrides,
    // 确保icons始终保留父级设置（除非overrides明确指定了icons）
    icons: overrides.icons || base.icons,
  };
  
  // 保留父级的其他重要字段（如果overrides中没有指定）
  if (!overrides.metadataBase && base.metadataBase) {
    result.metadataBase = base.metadataBase;
  }
  
  return result;
}
