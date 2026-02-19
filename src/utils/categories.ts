import { ToolCategoryId } from '@/lib/types'; // 引入工具分类ID类型定义

/**
 * 工具分类图标映射函数
 * - DRY：集中管理分类与图标的映射，避免各处重复 switch
 * - 简单直接：返回 Font Awesome 对应的 class 名
 * 
 * @param categoryId 工具分类ID
 * @returns Font Awesome图标类名
 */
export function getCategoryIcon(categoryId: ToolCategoryId | string): string {
  // 使用switch语句根据分类ID返回对应的Font Awesome图标类名
  switch (categoryId as ToolCategoryId) {
    case 'writing':
      return 'fa-pen'; // ✍️ 写文案
    case 'image':
      return 'fa-image'; // 🎨 做设计
    case 'video':
      return 'fa-video'; // 🎬 剪视频
    case 'audio':
      return 'fa-music'; // 🎧 听声音
    case 'office':
      return 'fa-briefcase'; // 💼 办办公
    case 'coding':
      return 'fa-code'; // 💻 写代码
    case 'utils':
      return 'fa-toolbox'; // 🔧 小工具
    default:
      return 'fa-search'; // 未知分类
  }
}

