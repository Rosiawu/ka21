import { ToolCategoryId } from '@/lib/types'; // 引入工具分类ID类型定义

/**
 * 工具分类图标映射函数
 * - 返回自定义 SVG 图标路径（rose+gold 渐变风格）
 *
 * @param categoryId 工具分类ID
 * @returns SVG 图标路径
 */
export function getCategoryIcon(categoryId: ToolCategoryId | string): string {
  switch (categoryId as ToolCategoryId) {
    case 'writing':
      return '/icons/nav/writing.svg';
    case 'image':
      return '/icons/nav/image.svg';
    case 'video':
      return '/icons/nav/video.svg';
    case 'audio':
      return '/icons/nav/audio.svg';
    case 'office':
      return '/icons/nav/office.svg';
    case 'coding':
      return '/icons/nav/coding.svg';
    case 'utils':
      return '/icons/nav/utils.svg';
    default:
      return '/icons/nav/utils.svg';
  }
}
