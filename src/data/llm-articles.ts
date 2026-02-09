/**
 * 大语言模型相关文章数据
 */

export interface LLMArticle {
  id: string;
  title: string;
  description: string;
  author: string;
  publishDate: string;
  url: string;
  category: '大模型介绍' | '模型对比' | '技术分析';
  skillTags: string[];
  recommendReason?: string;
  models: string[];
  comparisonType?: '性能对比' | '功能对比' | '应用场景对比';
}

export const llmArticles: LLMArticle[] = [
  {
    id: "wechat-article-1",
    title: "Qwen3模型介绍与开源内容解析",
    description: "深入介绍Qwen3模型的特性以及相关的开源技术和应用",
    author: "Simonlin",
    publishDate: "2024-05-06",
    url: "https://mp.weixin.qq.com/s/6HErjwoWK686nvAxQMA3Yg",
    category: "大模型介绍",
    skillTags: ["Qwen3", "开源大模型"],
    recommendReason: "了解最新的开源Qwen3模型，适合关注开源大模型的读者",
    models: ["Qwen3"],
  }
]; 