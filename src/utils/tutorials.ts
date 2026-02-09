/**
 * 教程分类到颜色的映射函数
 * - DRY：统一管理分类颜色，避免多处硬编码
 * - 视觉一致性：为不同教程分类提供统一的颜色方案
 * 
 * @param category 教程分类名称
 * @returns Tailwind CSS背景颜色类名
 */
export function getCategoryColor(category: string): string {
  // 根据教程分类返回对应的Tailwind CSS背景颜色类
  switch (category) {
    case '飞书多维表格':
      return 'bg-blue-500'; // 蓝色 - 飞书品牌色相关
    case 'AI大模型':
      return 'bg-purple-500'; // 紫色 - 代表AI技术的神秘感
    case 'AI绘画':
      return 'bg-pink-500'; // 粉色 - 代表创意和艺术
    case 'AI效率':
      return 'bg-green-500'; // 绿色 - 代表效率和生产力
    case '商业应用':
      return 'bg-orange-500'; // 橙色 - 代表商业活力
    case '学术研究':
      return 'bg-indigo-500'; // 靛蓝色 - 代表学术严肃性
    case '技术教程':
      return 'bg-red-500'; // 红色 - 代表技术的重要性
    default:
      return 'bg-red-500'; // 默认红色 - 未知分类的标准颜色
  }
}

