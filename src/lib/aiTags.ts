// 精简版AI特色标签定义
export const aiFeatureTags: Record<string, { name: string; color: string; priority: number }> = {
  // 核心功能类
  'ai-writing': { name: '写作生成器', color: '#10B981', priority: 1 },
  'ai-image': { name: 'AI绘画', color: '#F59E0B', priority: 1 },
  'ai-chat': { name: 'AI对话', color: '#3B82F6', priority: 1 },
  'ai-code': { name: '代码助手', color: '#8B5CF6', priority: 1 },
  'ai-audio': { name: '音频处理', color: '#EC4899', priority: 1 },
  'ai-video': { name: '视频制作', color: '#EF4444', priority: 1 },
  'ai-design': { name: 'AI设计', color: '#F59E0B', priority: 1 },
  'ai-search': { name: 'AI搜索', color: '#3B82F6', priority: 1 },
  'ai-assistant': { name: 'AI助手', color: '#3B82F6', priority: 1 },
  'ai-3d': { name: '3D生成', color: '#F59E0B', priority: 1 },
  'ai-podcast': { name: 'AI播客', color: '#8B5CF6', priority: 1 },
  
  // 特色功能类
  'rewriting': { name: '改写', color: '#10B981', priority: 2 },
  'research': { name: '研究', color: '#6366F1', priority: 2 },
  'summarization': { name: '摘要', color: '#10B981', priority: 2 },
  'translation': { name: '翻译', color: '#10B981', priority: 2 },
  'data-analysis': { name: '数据分析', color: '#6366F1', priority: 2 },
  'creativity': { name: '创意', color: '#EC4899', priority: 2 },
  'text-to-speech': { name: '文本转语音', color: '#EC4899', priority: 2 },
  'speech-to-text': { name: '语音转文本', color: '#EC4899', priority: 2 },
  'image-editing': { name: '图像编辑', color: '#F59E0B', priority: 2 },
  'video-editing': { name: '视频编辑', color: '#EF4444', priority: 2 },
  'content-generation': { name: '内容生成', color: '#10B981', priority: 2 },
  'personalization': { name: '个性化', color: '#8B5CF6', priority: 2 },
  'automation': { name: '自动化', color: '#6366F1', priority: 2 },
  'conversation': { name: '对话生成', color: '#10B981', priority: 2 },
  
  // 应用场景类
  'marketing': { name: '营销', color: '#EC4899', priority: 3 },
  'customer-support': { name: '客户支持', color: '#EC4899', priority: 3 },
  'productivity': { name: '生产力', color: '#8B5CF6', priority: 3 },
  'e-commerce': { name: '电子商务', color: '#EC4899', priority: 3 },
  'education': { name: '教育', color: '#0EA5E9', priority: 3 },
  'entertainment': { name: '娱乐', color: '#F59E0B', priority: 3 },
  'business': { name: '商业', color: '#6366F1', priority: 3 },
  'social-media': { name: '社交媒体', color: '#EC4899', priority: 3 },
  'healthcare': { name: '医疗健康', color: '#10B981', priority: 3 },
  'finance': { name: '金融', color: '#6366F1', priority: 3 },
  'legal': { name: '法律', color: '#8B5CF6', priority: 3 },
  'research-tool': { name: '研究工具', color: '#6366F1', priority: 3 },
};

// 标签选择函数 - 最多返回3个优先级最高的标签
export function selectTopTags(tags: string[]): string[] {
  // 过滤出有效标签并添加优先级信息
  const validTags = tags
    .filter(tag => tag in aiFeatureTags)
    .map(tag => ({
      id: tag,
      priority: aiFeatureTags[tag]?.priority || 99
    }));
  
  // 按优先级排序并取前3个
  return validTags
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(tag => tag.id);
} 