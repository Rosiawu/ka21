export type Tag = string;

export type RecommendLevel = "high" | "medium" | "low";

export type AccessibilityType = "直接访问" | "需要代理";

export type SortMethod = "recommend" | "newest" | "name" | "default";

export type DifficultyLevel = '小白入门' | '萌新进阶' | '高端玩家';

export type ToolCategoryId = 
  | "writing"       // AI写作工具
  | "image"         // AI图像工具  
  | "video"         // AI视频工具
  | "office"        // AI办公工具
  | "design"        // AI设计工具
  | "chat"          // AI对话聊天
  | "coding"        // AI编程工具
  | "audio"         // AI音频工具
  | "dev-platform"  // AI开发平台
  | "agent"         // AI通用智能体
  | "podcast"       // AI播客工具
  | "misc"          // 其他AI工具 - AI 技术驱动但暂无法归类到上述具体大类的兜底分类
  | "utils";         // 效率小玩意 - 轻量高效但非 AI 核心驱动的小工具，例如格式转换/PDF 压缩等

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  icon: string;
  description?: string; // 分类简介，可在前端渲染
}

export interface Guide {
  title: string;
  content: string;
  type: "video" | "text" | "注意事项";
}

export interface RelatedArticle {
  title: string;
  url: string;
  source?: string;
  publishDate?: string;
  customDifficultyLevel?: DifficultyLevel;
  customCategory?: string;
  customSkillTags?: string[];
  customImageUrl?: string;
  customRecommendReason?: string;
}

export interface GroupComment {
  content: string;
  author?: string;
  createdAt?: string;
  reviewType?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icons?: {
    svg?: string;
    png?: string;
  };
  icon?: string;
  url: string;
  tags: Tag[];
  toolCategory?: ToolCategoryId;
  recommendLevel?: RecommendLevel;
  accessibility?: AccessibilityType;
  displayOrder?: number;
  guides?: Guide[];
  // TODO: [后期优化] 当教程数据完全迁移并稳定后，移除此字段，仅使用relatedTutorials
  // 参考项目根目录下的TODO.md文件中的"移除兼容层"任务
  relatedArticles?: RelatedArticle[];
  relatedTutorials?: string[]; // 关联教程的ID列表，用于新的教程数据结构
  groupComments?: GroupComment[];
  createdAt?: string;
  updatedAt?: string;
  isVisible?: boolean; // 控制工具是否在前端显示，默认为true。设置为false时工具将被隐藏但保留数据，用于实现"精品轮动"策略
  // 热门推荐板块主分类（可选，若存在则优先用于归属与SSR稳定展示）
  hotPrimaryCategory?: string;
}

export interface Comment {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface ToolSubmission {
  name: string;
  description: string;
  shortDescription: string;
  url: string;
  categories: Tag[];
}

// 已移除百度统计全局变量声明
