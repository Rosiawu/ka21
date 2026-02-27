import {
  type CoreScenarioId,
  getCoreScenarioColorClass,
  getCoreScenarioLabel,
} from '@/lib/coreTaxonomy';

const CORE_SCENARIO_IDS: CoreScenarioId[] = [
  'content-writing',
  'image-design',
  'video-creation',
  'audio-podcast',
  'office-productivity',
  'coding-development',
  'agent-automation',
  'learning-research',
  'commerce-marketing',
  'data-analysis',
];

function isCoreScenarioId(value: string): value is CoreScenarioId {
  return CORE_SCENARIO_IDS.includes(value as CoreScenarioId);
}

/**
 * 教程分类到颜色的映射函数
 * - DRY：统一管理分类颜色，避免多处硬编码
 * - 视觉一致性：为不同教程分类提供统一的颜色方案
 * 
 * @param category 教程分类名称
 * @returns Tailwind CSS背景颜色类名
 */
export function getCategoryColor(category: string): string {
  if (isCoreScenarioId(category)) {
    return getCoreScenarioColorClass(category);
  }

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

export function localizeTutorialCategory(category: string, locale: "zh" | "en"): string {
  if (isCoreScenarioId(category)) {
    return getCoreScenarioLabel(category, locale);
  }

  if (locale !== "en") return category;

  const enMap: Record<string, string> = {
    "AI效率": "AI Productivity",
    "AI图像": "AI Imaging",
    "AI视频": "AI Video",
    "AI编程": "AI Coding",
    "AI音频": "AI Audio",
    "AI智能体": "AI Agents",
    "AI大模型": "AI LLMs",
    "飞书多维表格": "Feishu Bitable",
    "AI绘画": "AI Drawing",
    "AI设计": "AI Design",
    "AI播客": "AI Podcast",
    "AI通用智能体": "General AI Agents",
    "AI办公": "AI Office",
    "商业应用": "Business Use Cases",
    "学术研究": "Academic Research",
    "技术教程": "Technical Tutorials",
  };

  return enMap[category] || category;
}

export function localizeDifficultyLevel(level: string, locale: "zh" | "en"): string {
  if (locale !== "en") return level;
  if (level === "小白入门") return "Beginner";
  if (level === "萌新进阶") return "Intermediate";
  if (level === "高端玩家") return "Advanced";
  return level;
}
