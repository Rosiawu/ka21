import type { Metadata, ResolvingMetadata } from 'next';

function cloneMetadataValue<T>(value: T): T {
  if (value == null) {
    return value;
  }

  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

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
    // Next 会在 metadata 解析阶段继续补充 icon descriptor。
    // 这里必须返回一个可变副本，不能复用父级 metadata 中可能被冻结的对象。
    icons: cloneMetadataValue(overrides.icons ?? base.icons),
  };
  
  // 保留父级的其他重要字段（如果overrides中没有指定）
  if (!overrides.metadataBase && base.metadataBase) {
    result.metadataBase = cloneMetadataValue(base.metadataBase);
  }
  
  return result;
}
