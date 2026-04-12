import type { Metadata, ResolvingMetadata } from 'next';
import { createDefaultIcons, createMetadataBase } from './siteMetadata';

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
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  // 直接注入站点默认 metadata，避免在运行时克隆 Next 解析后的 metadata 对象。
  const result: Metadata = {
    ...overrides,
    icons: overrides.icons ?? createDefaultIcons(),
  };

  if (!overrides.metadataBase) {
    result.metadataBase = createMetadataBase();
  }

  return result;
}
