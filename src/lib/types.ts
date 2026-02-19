export type Tag = string;

export type RecommendLevel = "high" | "medium" | "low";

export type AccessibilityType = "直接访问" | "需要代理";

export type SortMethod = "recommend" | "newest" | "name" | "default";

export type DifficultyLevel = '小白入门' | '萌新进阶' | '高端玩家';

export type ToolCategoryId = 
  | "writing"       // ✍️ 写文案 (writing + chat + agent)
  | "image"         // 🎨 做设计 (image + design)
  | "video"         // 🎬 做视频 (video)
  | "audio"         // 🎧 听声音 (audio + podcast)
  | "office"        // 💼 办办公 (office)
  | "coding"        // 💻 写代码 (coding)
  | "utils";        // 🔧 小工具 (utils + misc + dev-platform)

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
