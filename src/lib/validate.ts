// 引入类型定义
import { Tool, RecommendLevel, AccessibilityType, ToolCategoryId } from './types'; // 引入工具、推荐级别、访问类型、分类ID等类型

// ========== 工具数据验证函数 ==========

/**
 * 验证单个工具数据是否符合Tool接口规范
 * - 使用TypeScript类型守卫模式，确保数据类型的正确性
 * - 验证所有必需字段和可选字段的数据类型
 * - 支持复杂的嵌套对象和数组验证
 * 
 * @param data 待验证的数据（未知类型）
 * @returns 如果数据符合Tool接口规范则返回true，否则返回false
 */
export function validateTool(data: unknown): data is Tool {
  // 基础类型检查：确保数据是对象
  if (!data || typeof data !== 'object') return false; // 如果数据为空或不是对象，验证失败

  const tool = data as Record<string, unknown>; // 将数据转换为可索引的对象类型

  // ========== 必需字段验证 ==========
  
  // 验证工具ID
  if (!tool.id || typeof tool.id !== 'string') return false; // ID必须是非空字符串
  
  // 验证工具名称
  if (!tool.name || typeof tool.name !== 'string') return false; // 名称必须是非空字符串
  
  // 验证工具描述
  if (!tool.description || typeof tool.description !== 'string') return false; // 描述必须是非空字符串
  
  // 验证工具URL
  if (!tool.url || typeof tool.url !== 'string') return false; // URL必须是非空字符串
  
  // ========== 图标字段验证 ==========
  
  // 验证图标对象（可选）
  if (tool.icons !== undefined && tool.icons !== null) { // 如果icons字段存在
    if (typeof tool.icons !== 'object') return false; // icons必须是对象
    const icons = tool.icons as Record<string, unknown>; // 转换为可索引对象
    if (icons.svg !== undefined && typeof icons.svg !== 'string') return false; // svg图标必须是字符串
    if (icons.png !== undefined && typeof icons.png !== 'string') return false; // png图标必须是字符串
  }
  
  // 验证单个图标字段（可选）
  if (tool.icon !== undefined && typeof tool.icon !== 'string') return false; // 单个图标必须是字符串
  
  // ========== 标签数组验证 ==========
  
  // 验证标签数组
  if (!Array.isArray(tool.tags) || !tool.tags.every((tag: unknown): tag is string => typeof tag === 'string')) {
    return false; // 标签必须是字符串数组
  }

  // ========== 工具分类验证 ==========
  
  // 验证工具类型分类（可选）
  if (tool.toolCategory !== undefined) { // 如果分类字段存在
    const validToolCategories: ToolCategoryId[] = [ // 定义有效的工具分类列表
      'writing',      // AI写作工具
      'image',         // AI图像工具
      'video',         // AI视频工具
      'office',        // AI办公工具
      'design',        // AI设计工具
      'chat',          // AI对话聊天
      'coding',        // AI编程工具
      'audio',         // AI音频工具
      'dev-platform',  // AI开发平台
      'agent',         // AI通用智能体
      'podcast',       // AI播客工具
      'misc',          // 其他AI工具
      'utils'          // 四次元小工具
    ];
    if (!validToolCategories.includes(tool.toolCategory as ToolCategoryId)) { // 检查分类是否在有效列表中
      return false; // 如果分类无效，验证失败
    }
  }

  // ========== 推荐等级验证 ==========
  
  // 验证推荐等级（可选）
  if (tool.recommendLevel !== undefined) { // 如果推荐等级字段存在
    const validLevels: RecommendLevel[] = ['high', 'medium', 'low']; // 定义有效的推荐等级
    if (!validLevels.includes(tool.recommendLevel as RecommendLevel)) { // 检查等级是否有效
      return false; // 如果等级无效，验证失败
    }
  }

  // ========== 可访问性验证 ==========
  
  // 验证可访问性（可选）
  if (tool.accessibility !== undefined) { // 如果可访问性字段存在
    const validAccessibility: AccessibilityType[] = ['直接访问', '需要代理']; // 定义有效的访问类型
    if (!validAccessibility.includes(tool.accessibility as AccessibilityType)) { // 检查访问类型是否有效
      return false; // 如果访问类型无效，验证失败
    }
  }

  // ========== 指南数组验证 ==========
  
  // 验证指南数组（可选）
  if (tool.guides !== undefined) { // 如果指南字段存在
    if (!Array.isArray(tool.guides)) return false; // 指南必须是数组
    for (const guide of tool.guides) { // 遍历每个指南
      if (!guide || typeof guide !== 'object') return false; // 指南必须是对象
      if (!guide.title || typeof guide.title !== 'string') return false; // 指南标题必须是非空字符串
      if (!guide.content || typeof guide.content !== 'string') return false; // 指南内容必须是非空字符串
      if (!guide.type || !['video', 'text', '注意事项'].includes(guide.type)) return false; // 指南类型必须是有效值
    }
  }

  // ========== 相关文章数组验证 ==========
  
  // 验证相关文章数组（可选）
  if (tool.relatedArticles !== undefined) { // 如果相关文章字段存在
    if (!Array.isArray(tool.relatedArticles)) return false; // 相关文章必须是数组
    for (const article of tool.relatedArticles) { // 遍历每篇文章
      if (!article || typeof article !== 'object') return false; // 文章必须是对象
      if (!article.title || typeof article.title !== 'string') return false; // 文章标题必须是非空字符串
      if (!article.url || typeof article.url !== 'string') return false; // 文章URL必须是非空字符串
      if (article.source !== undefined && typeof article.source !== 'string') return false; // 文章来源必须是字符串
      if (article.publishDate !== undefined && typeof article.publishDate !== 'string') return false; // 发布日期必须是字符串
    }
  }
  
  // ========== 群友点评数组验证 ==========
  
  // 验证群友点评数组（可选）
  if (tool.groupComments !== undefined) { // 如果群友点评字段存在
    if (!Array.isArray(tool.groupComments)) return false; // 群友点评必须是数组
    for (const comment of tool.groupComments) { // 遍历每个点评
      if (!comment || typeof comment !== 'object') return false; // 点评必须是对象
      if (!comment.content || typeof comment.content !== 'string') return false; // 点评内容必须是非空字符串
      if (comment.author !== undefined && typeof comment.author !== 'string') return false; // 点评作者必须是字符串
      if (comment.createdAt !== undefined && typeof comment.createdAt !== 'string') return false; // 创建时间必须是字符串
      if (comment.reviewType !== undefined && typeof comment.reviewType !== 'string') return false; // 点评类型必须是字符串
    }
  }

  return true; // 所有验证通过，返回true
}

/**
 * 验证工具数组数据是否符合Tool[]接口规范
 * - 验证数据是否为数组类型
 * - 使用every方法确保数组中的每个元素都通过validateTool验证
 * - 提供批量验证工具数据的功能
 * 
 * @param data 待验证的数据（未知类型）
 * @returns 如果数据是有效的工具数组则返回true，否则返回false
 */
export function validateTools(data: unknown): data is Tool[] {
  if (!Array.isArray(data)) return false; // 如果数据不是数组，验证失败
  return data.every((item: unknown) => validateTool(item)); // 验证数组中的每个元素都是有效的工具
} 