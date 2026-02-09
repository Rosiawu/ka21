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
      return 'fa-pen'; // AI写作工具 - 笔图标
    case 'image':
      return 'fa-image'; // AI图像工具 - 图片图标
    case 'video':
      return 'fa-video'; // AI视频工具 - 视频图标
    case 'office':
      return 'fa-briefcase'; // AI办公工具 - 公文包图标
    case 'design':
      return 'fa-palette'; // AI设计工具 - 调色板图标
    case 'chat':
      return 'fa-comments'; // AI对话聊天 - 对话气泡图标
    case 'coding':
      return 'fa-code'; // AI编程工具 - 代码图标
    case 'audio':
      return 'fa-music'; // AI音频工具 - 音乐图标
    case 'dev-platform':
      return 'fa-server'; // AI开发平台 - 服务器图标
    case 'agent':
      return 'fa-robot'; // AI通用智能体 - 机器人图标
    case 'podcast':
      return 'fa-microphone'; // AI播客工具 - 麦克风图标
    case 'utils':
      return 'fa-toolbox'; // 四次元小工具 - 工具箱图标
    default:
      return 'fa-search'; // misc 或未知分类 - 搜索图标
  }
}

