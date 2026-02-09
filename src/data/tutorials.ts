/**
 * @file 教程数据文件
 * @description 根据配置，可以从tools.json或tutorials.json中加载教程数据
 * 
 * 教程数据加载策略:
 * 1. 优先尝试从tutorials.json加载数据(新数据源)
 * 2. 如果启用了新数据源但加载失败，则不返回任何教程
 * 3. 旧版extractTutorialsFromTools方法已废弃不再使用
 * 
 * 新旧数据源的主要区别:
 * - 旧: 教程数据嵌套在工具中的relatedArticles字段
 * - 新: 教程数据独立存储在tutorials.json，通过relatedTools关联工具
 */

import { USE_NEW_TUTORIALS_SOURCE } from '@/lib/config';
// 导入tutorials.json的类型定义
import type { TutorialsJson, TutorialData } from '@/types/tutorials';

// 静态导入tutorials.json，避免require调用
import tutorialsJsonData from './tutorials.json';

// 类型转换以匹配预期接口
const tutorialsFromJson: TutorialData[] = USE_NEW_TUTORIALS_SOURCE 
  ? (tutorialsJsonData as unknown as TutorialsJson).tutorials || []
  : [];

export type DifficultyLevel = '小白入门' | '萌新进阶' | '高端玩家';
export type TutorialSortMethod = 'latest' | 'oldest' | 'difficulty-asc';

// 扩展的相关文章接口，添加自定义字段
export interface RelatedArticleExtended {
  title: string;
  url: string;
  source?: string;
  publishDate?: string;
  customDifficultyLevel?: DifficultyLevel;  // 自定义难度级别
  customCategory?: string;                  // 自定义内容分类
  customSkillTags?: string[];               // 自定义技能标签
  customImageUrl?: string;                  // 自定义图片URL
  customRecommendReason?: string;           // 自定义推荐理由
}

/**
 * 教程接口定义
 * 该接口在新旧数据源之间保持一致，确保前端组件不受数据源变化影响
 */
export interface Tutorial {
  id: string;                     // 教程唯一标识符
  title: string;                  // 教程标题
  description: string;            // 教程描述
  imageUrl: string;               // 教程图片URL
  author: string;                 // 作者/来源
  publishDate: string;            // 发布日期
  url: string;                    // 教程链接
  category: string;               // 分类
  difficultyLevel: DifficultyLevel; // 难度级别
  skillTags: string[];            // 技能标签
  recommendReason?: string;       // 推荐理由
  relatedTools?: string[];        // 关联的工具ID
}

// 不同颜色的渐变背景作为默认图片
const GRADIENT_COLORS = [
  { start: '#667eea', end: '#764ba2' }, // 紫蓝渐变
  { start: '#06b6d4', end: '#3b82f6' }, // 蓝色渐变
  { start: '#8b5cf6', end: '#ec4899' }, // 紫粉渐变 
  { start: '#84cc16', end: '#22c55e' }, // 绿色渐变
  { start: '#f97316', end: '#ef4444' }, // 橙红渐变
  { start: '#14b8a6', end: '#0ea5e9' }  // 青蓝渐变
];

/**
 * 生成SVG渐变背景的数据URL
 * @param index 颜色索引
 * @param category 分类名称，用于显示在图片中
 * @returns SVG数据URL
 */
const generateGradientSvg = (index: number, category: string): string => {
  const colorIndex = index % GRADIENT_COLORS.length;
  const { start, end } = GRADIENT_COLORS[colorIndex];
  
  // 创建带有分类名的渐变SVG
  const encodedCategory = category.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="grad${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${start};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${end};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#grad${colorIndex})" />
    <text x="50%" y="48%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${encodedCategory}</text>
    <text x="50%" y="54%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">教程</text>
  </svg>`;
  
  // 直接使用原始SVG字符串作为URL编码
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
};

/**
 * 根据分类获取合适的图片URL
 * @param category 文章分类
 * @param index 文章索引，用于确定默认图片
 * @returns 适合该分类的图片URL
 */
const getCategoryImage = (category: string, index: number = 0): string => {
  // 使用SVG渐变图作为默认图片
  return generateGradientSvg(index, category);
};

/**
 * 从tutorials.json中加载教程数据
 * @returns 处理后的教程数组
 * 
 * 数据转换映射:
 * - source → author (保持API兼容性)
 * - customImageUrl → imageUrl (优先使用自定义图片)
 * - 如果无描述信息，使用标题作为描述
 * - 添加默认值确保数据完整性
 */
const loadTutorialsFromJson = (): Tutorial[] => {
  // 检查tutorialsData是否存在并具有正确结构
  if (!tutorialsFromJson || !Array.isArray(tutorialsFromJson) || tutorialsFromJson.length === 0) {
    console.warn('tutorials.json数据无效或为空');
    return [];
  }
  
  // 统计不同分类的教程数量，用于生成图片
  const categoryCounters: Record<string, number> = {};

  return tutorialsFromJson.map((tutorial: TutorialData) => {
    // 计数器，用于生成唯一的渐变图片
    if (!categoryCounters[tutorial.category]) {
      categoryCounters[tutorial.category] = 0;
    }
    const categoryIndex = categoryCounters[tutorial.category]++;
    
    // 处理自定义图片URL
    let imageUrl = getCategoryImage(tutorial.category, categoryIndex);
    
    if (tutorial.customImageUrl) {
      // 确保路径正确
      const customImage = String(tutorial.customImageUrl);
      if (customImage.startsWith('http')) {
        // 外部URL，直接使用
        imageUrl = customImage;
      } else {
        // 相对路径，确保格式正确
        imageUrl = customImage.startsWith('/') ? customImage : `/${customImage}`;
      }
    }
    
    // 确保教程数据符合Tutorial接口要求
    return {
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description || tutorial.title, // 如果没有描述则使用标题
      imageUrl: imageUrl,
      author: tutorial.source || "AI践行者",
      publishDate: tutorial.publishDate || new Date().toISOString().split('T')[0],
      url: tutorial.url,
      category: tutorial.category,
      difficultyLevel: tutorial.difficultyLevel as DifficultyLevel,
      skillTags: tutorial.skillTags || [],
      recommendReason: tutorial.recommendReason,
      relatedTools: tutorial.relatedTools || []
    };
  });
};

// 根据配置选择教程数据来源
export const tutorials = USE_NEW_TUTORIALS_SOURCE && tutorialsFromJson.length > 0
  ? loadTutorialsFromJson()
  : [];

/**
 * 按指定方式排序教程
 * @param tutorials 教程数组
 * @param sortMethod 排序方法
 * @returns 排序后的教程数组
 */
export const sortTutorials = (tutorials: Tutorial[], sortMethod: TutorialSortMethod): Tutorial[] => {
  switch (sortMethod) {
    case 'oldest':
      // 按发布日期从旧到新排序
      return [...tutorials].sort((a, b) => 
        new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
      );
    
    case 'difficulty-asc':
      // 按难度级别从低到高排序
      const difficultyOrder: Record<DifficultyLevel, number> = {
        '小白入门': 1,
        '萌新进阶': 2,
        '高端玩家': 3
      };
      return [...tutorials].sort((a, b) => 
        difficultyOrder[a.difficultyLevel] - difficultyOrder[b.difficultyLevel]
      );
    
    case 'latest':
    default:
      // 默认按发布日期从新到旧排序
      return [...tutorials].sort((a, b) => 
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );
  }
};

/**
 * 教程查找策略:
 * 1. 首先尝试通过精确ID匹配查找
 * 2. 如果找不到，再尝试通过URL匹配
 * 3. 这种多级查找确保即使数据结构改变，现有代码引用也不会受到影响
 */

/**
 * 通过ID或URL查找教程
 * @param idOrUrl 教程ID或URL
 * @returns 找到的教程或undefined
 */
export function findTutorialById(idOrUrl: string): Tutorial | undefined {
  // 尝试按ID查找
  let tutorial = tutorials.find(tutorial => tutorial.id === idOrUrl);
  
  // 如果没找到，尝试按URL查找
  if (!tutorial) {
    tutorial = tutorials.find(tutorial => tutorial.url === idOrUrl);
  }
  
  return tutorial;
}

/**
 * 通过URL片段查找教程（兼容旧版函数）
 * @param slug URL片段
 * @returns 找到的教程或undefined
 * @deprecated 使用findTutorialById替代
 */
export function findTutorialBySlug(slug: string): Tutorial | undefined {
  return tutorials.find(tutorial => {
    // 从URL中提取slug部分并与参数比较
    const urlSlug = tutorial.url.split('/').pop() || '';
    return urlSlug === slug;
  });
} 

// 默认导出所有教程
export default tutorials; 