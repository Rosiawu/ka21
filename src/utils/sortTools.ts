// 引入类型定义
import { Tool, RecommendLevel, ToolCategoryId, SortMethod } from '@/lib/types'; // 引入工具、推荐级别、分类ID、排序方法等类型

// ========== 权重配置常量 ==========

/**
 * 工具推荐级别权重映射
 * - 用于排序时计算推荐级别的优先级
 * - 数值越高，排序优先级越高
 */
const RECOMMEND_LEVEL_WEIGHTS: Record<RecommendLevel, number> = {
  high: 3,    // 高推荐级别，权重最高
  medium: 2,  // 中等推荐级别，权重中等
  low: 1      // 低推荐级别，权重最低
};

/**
 * 工具类别权重映射 - 自定义类别的显示优先级
 * - 用于排序时计算分类的优先级
 * - 数值越高，排序优先级越高
 * - 可以根据业务需求调整各分类的权重
 */
const CATEGORY_WEIGHTS: Record<ToolCategoryId, number> = {
  writing: 10,     // ✍️ 写文案
  image: 9,        // 🎨 做设计
  video: 8,        // 🎬 做视频
  audio: 7,        // 🎧 听声音
  office: 6,       // 💼 办办公
  coding: 5,       // 💻 写代码
  utils: 4         // 🔧 小工具
};

// ========== 基础排序函数 ==========

/**
 * 按推荐级别排序工具
 * - 优先按推荐级别排序（高推荐优先）
 * - 二级排序：displayOrder（自定义显示顺序）
 * - 三级排序：工具名称（字母顺序）
 * 
 * @param tools 工具数组
 * @returns 排序后的工具数组
 */
export function sortByRecommendLevel(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => { // 创建数组副本并排序
    // 一级排序：displayOrder（自定义显示顺序）
    // 如果两个工具都有displayOrder，按数值升序排列
    if (typeof a.displayOrder === 'number' && typeof b.displayOrder === 'number') {
      return a.displayOrder - b.displayOrder;
    }
    // 如果只有一个有displayOrder，它排在前面
    if (typeof a.displayOrder === 'number') return -1;
    if (typeof b.displayOrder === 'number') return 1;

    // 二级排序：推荐级别
    const aWeight = a.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[a.recommendLevel] : 0; // 工具A的推荐权重
    const bWeight = b.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[b.recommendLevel] : 0; // 工具B的推荐权重
    
    // 如果推荐级别不同，按推荐级别排序（降序）
    if (bWeight !== aWeight) return bWeight - aWeight;
    
    // 三级排序：名称（字母顺序）
    return a.name.localeCompare(b.name); // 按名称字母顺序排序
  });
}

/**
 * 按工具类别排序工具
 * - 仅按类别权重排序，不考虑displayOrder
 * - 权重高的分类排在前面
 * 
 * @param tools 工具数组
 * @returns 排序后的工具数组
 */
export function sortByCategory(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => { // 创建数组副本并排序
    // 仅按类别排序，不考虑displayOrder
    const aCatWeight = a.toolCategory ? CATEGORY_WEIGHTS[a.toolCategory] : 0; // 工具A的分类权重
    const bCatWeight = b.toolCategory ? CATEGORY_WEIGHTS[b.toolCategory] : 0; // 工具B的分类权重
    return bCatWeight - aCatWeight; // 按分类权重降序排列
  });
}

/**
 * 按更新时间排序工具（最新优先）
 * - 仅按更新时间排序，不考虑displayOrder
 * - 最近更新的工具排在前面
 * 
 * @param tools 工具数组
 * @returns 排序后的工具数组
 */
export function sortByUpdateTime(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => { // 创建数组副本并排序
    // 仅按更新时间排序，不考虑displayOrder
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0; // 工具A的更新时间戳
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0; // 工具B的更新时间戳
    return bTime - aTime; // 按更新时间降序排列（最新的在前）
  });
}

/**
 * 按名称字母顺序排序工具
 * - 仅按名称排序，不考虑displayOrder
 * - 使用localeCompare进行本地化字符串比较
 * 
 * @param tools 工具数组
 * @returns 排序后的工具数组
 */
export function sortByName(tools: Tool[]): Tool[] {
  // 仅按名称排序，不考虑displayOrder
  return [...tools].sort((a, b) => a.name.localeCompare(b.name)); // 按名称字母顺序排序
}

/**
 * 按默认顺序排序工具 - 使用自定义displayOrder字段，没有则按推荐等级
 * - 优先按displayOrder排序（自定义显示顺序）
 * - 如果没有displayOrder，则按推荐级别排序
 * - 这是最常用的排序方式，平衡了自定义顺序和推荐级别
 * 
 * @param tools 工具数组
 * @returns 排序后的工具数组
 */
export function sortByDefaultOrder(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => { // 创建数组副本并排序
    // 1. 优先按displayOrder排序（如果有该字段）
    if (typeof a.displayOrder === 'number' && typeof b.displayOrder === 'number') { // 如果两个工具都有displayOrder
      return a.displayOrder - b.displayOrder; // 数字小的排前面
    }
    
    // 2. 如果只有一个工具有displayOrder，有displayOrder的优先
    if (typeof a.displayOrder === 'number') return -1; // A有displayOrder，A优先
    if (typeof b.displayOrder === 'number') return 1;  // B有displayOrder，B优先
    
    // 3. 都没有displayOrder则按推荐等级排序
    const aWeight = a.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[a.recommendLevel] : 0; // 工具A的推荐权重
    const bWeight = b.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[b.recommendLevel] : 0; // 工具B的推荐权重
    return bWeight - aWeight; // 按推荐级别降序排列
  });
}

/**
 * 多级排序工具 - 首先按推荐级别，然后按类别，最后按更新时间
 * - 这是最全面的排序方式，综合考虑多个因素
 * - 适用于需要综合排序的场景
 * 
 * @param tools 工具数组
 * @returns 排序后的工具数组
 */
export function sortTools(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => { // 创建数组副本并排序
    // 1. 按推荐级别排序
    const aRecWeight = a.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[a.recommendLevel] : 0; // 工具A的推荐权重
    const bRecWeight = b.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[b.recommendLevel] : 0; // 工具B的推荐权重
    if (aRecWeight !== bRecWeight) { // 如果推荐级别不同
      return bRecWeight - aRecWeight; // 按推荐级别降序排列
    }
    
    // 2. 按工具类别排序
    const aCatWeight = a.toolCategory ? CATEGORY_WEIGHTS[a.toolCategory] : 0; // 工具A的分类权重
    const bCatWeight = b.toolCategory ? CATEGORY_WEIGHTS[b.toolCategory] : 0; // 工具B的分类权重
    if (aCatWeight !== bCatWeight) { // 如果分类权重不同
      return bCatWeight - aCatWeight; // 按分类权重降序排列
    }
    
    // 3. 按更新时间排序
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0; // 工具A的更新时间戳
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0; // 工具B的更新时间戳
    return bTime - aTime; // 按更新时间降序排列（最新的在前）
  });
}

// ========== 过滤函数 ==========

/**
 * 过滤工具函数 - 按访问方式筛选
 * - 根据工具的访问方式（如免费、付费等）进行筛选
 * 
 * @param tools 工具数组
 * @param accessibility 访问方式筛选条件
 * @returns 过滤后的工具数组
 */
export function filterByAccessibility(tools: Tool[], accessibility: string | null): Tool[] {
  if (!accessibility) return tools; // 如果没有筛选条件，返回原数组
  return tools.filter(tool => tool.accessibility === accessibility); // 筛选匹配访问方式的工具
}

/**
 * 过滤工具函数 - 按标签筛选
 * - 筛选包含所有指定标签的工具
 * - 使用every方法确保工具包含所有选中的标签
 * 
 * @param tools 工具数组
 * @param tags 标签数组
 * @returns 过滤后的工具数组
 */
export function filterByTags(tools: Tool[], tags: string[]): Tool[] {
  if (!tags || tags.length === 0) return tools; // 如果没有标签筛选条件，返回原数组
  return tools.filter(tool => {
    // 检查工具是否包含所有选中的标签
    return tags.every(tag => tool.tags.includes(tag)); // 使用every确保工具包含所有标签
  });
}

// ========== 标签排序相关 ==========

// 临时类型，用于标签匹配计数
interface ToolWithMatchCount extends Tool {
  matchCount: number; // 匹配的标签数量
}

/**
 * 按标签筛选并排序工具 - 按匹配标签数量排序
 * - 先筛选包含选中标签的工具
 * - 再按匹配标签数量排序（匹配越多越优先）
 * - 最后使用多级排序作为二级排序
 * 
 * @param tools 工具数组
 * @param selectedTags 选中的标签数组
 * @returns 筛选并排序后的工具数组
 */
export function filterAndSortByTags(tools: Tool[], selectedTags: string[]): Tool[] {
  if (!selectedTags || selectedTags.length === 0) { // 如果没有选中标签
    return sortTools(tools); // 使用默认多级排序
  }
  
  // 筛选含有选中标签的工具
  const filteredTools = filterByTags(tools, selectedTags); // 使用标签过滤函数
  
  // 计算每个工具匹配的标签数量
  const toolsWithMatchCount = filteredTools.map(tool => ({
    ...tool, // 展开工具的所有属性
    matchCount: selectedTags.filter(tag => tool.tags.includes(tag)).length // 计算匹配的标签数量
  }));
  
  // 先按匹配标签数排序，再使用默认多级排序
  return toolsWithMatchCount.sort((a, b) => {
    // 优先按匹配标签数排序（降序）
    const aWithMatch = a as ToolWithMatchCount; // 类型断言
    const bWithMatch = b as ToolWithMatchCount; // 类型断言
    if (bWithMatch.matchCount !== aWithMatch.matchCount) { // 如果匹配标签数不同
      return bWithMatch.matchCount - aWithMatch.matchCount; // 按匹配数量降序排列
    }
    
    // 若匹配标签数相同，则使用默认多级排序逻辑
    // 1. 按推荐级别排序
    const aRecWeight = a.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[a.recommendLevel] : 0; // 工具A的推荐权重
    const bRecWeight = b.recommendLevel ? RECOMMEND_LEVEL_WEIGHTS[b.recommendLevel] : 0; // 工具B的推荐权重
    if (aRecWeight !== bRecWeight) { // 如果推荐级别不同
      return bRecWeight - aRecWeight; // 按推荐级别降序排列
    }
    
    // 2. 按工具类别排序
    const aCatWeight = a.toolCategory ? CATEGORY_WEIGHTS[a.toolCategory] : 0; // 工具A的分类权重
    const bCatWeight = b.toolCategory ? CATEGORY_WEIGHTS[b.toolCategory] : 0; // 工具B的分类权重
    if (aCatWeight !== bCatWeight) { // 如果分类权重不同
      return bCatWeight - aCatWeight; // 按分类权重降序排列
    }
    
    // 3. 按更新时间排序
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0; // 工具A的更新时间戳
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0; // 工具B的更新时间戳
    return bTime - aTime; // 按更新时间降序排列（最新的在前）
  });
}

// ========== 工具函数 ==========

/**
 * 使用排序函数对工具进行排序
 * - 根据指定的排序方法调用对应的排序函数
 * - 提供统一的排序接口
 * 
 * @param tools 工具数组
 * @param sortMethod 排序方法
 * @returns 排序后的工具数组
 */
export function applySorting(tools: Tool[], sortMethod: SortMethod): Tool[] {
  switch (sortMethod) { // 根据排序方法选择对应的排序函数
    case 'default': // 默认排序
      return sortByDefaultOrder(tools); // 使用默认顺序排序
    case 'recommend': // 推荐排序
      return sortByRecommendLevel(tools); // 使用推荐级别排序
    case 'newest': // 最新排序
      return sortByUpdateTime(tools); // 使用更新时间排序
    case 'name': // 名称排序
      return sortByName(tools); // 使用名称排序
    default: // 默认情况
      return sortByDefaultOrder(tools); // 默认使用自定义排序
  }
}

/**
 * 过滤工具函数 - 获取可见工具
 * 该函数用于从工具列表中筛选出可见的工具
 * 遵循以下规则:
 * 1. 如果工具的isVisible字段明确设为false，则该工具被视为隐藏
 * 2. 如果工具没有isVisible字段或isVisible为true，则该工具可见
 * 3. 支持"精品轮动"策略，隐藏的工具数据仍然保留在数据库中，只是不在前端显示
 * 
 * @param tools 完整的工具数组
 * @returns 仅包含可见工具的数组
 */
export function getVisibleTools(tools: Tool[]): Tool[] {
  return tools.filter(tool => tool.isVisible !== false); // 默认未设置isVisible的工具也显示
} 