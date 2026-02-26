export type TagLocale = "zh" | "en";

type AiTagMeta = {
  label: Record<TagLocale, string>;
  color: string;
  priority: number;
};

// 精简版 AI 特色标签定义（中英双语）
export const aiFeatureTags: Record<string, AiTagMeta> = {
  // 核心功能类
  'ai-writing': { label: { zh: '写作生成器', en: 'Writing Generator' }, color: '#10B981', priority: 1 },
  'ai-image': { label: { zh: 'AI绘画', en: 'AI Image' }, color: '#F59E0B', priority: 1 },
  'ai-chat': { label: { zh: 'AI对话', en: 'AI Chat' }, color: '#3B82F6', priority: 1 },
  'ai-code': { label: { zh: '代码助手', en: 'Code Assistant' }, color: '#8B5CF6', priority: 1 },
  'ai-audio': { label: { zh: '音频处理', en: 'Audio Processing' }, color: '#EC4899', priority: 1 },
  'ai-video': { label: { zh: '视频制作', en: 'Video Creation' }, color: '#EF4444', priority: 1 },
  'ai-design': { label: { zh: 'AI设计', en: 'AI Design' }, color: '#F59E0B', priority: 1 },
  'ai-search': { label: { zh: 'AI搜索', en: 'AI Search' }, color: '#3B82F6', priority: 1 },
  'ai-assistant': { label: { zh: 'AI助手', en: 'AI Assistant' }, color: '#3B82F6', priority: 1 },
  'ai-3d': { label: { zh: '3D生成', en: '3D Generation' }, color: '#F59E0B', priority: 1 },
  'ai-podcast': { label: { zh: 'AI播客', en: 'AI Podcast' }, color: '#8B5CF6', priority: 1 },
  
  // 特色功能类
  'rewriting': { label: { zh: '改写', en: 'Rewriting' }, color: '#10B981', priority: 2 },
  'research': { label: { zh: '研究', en: 'Research' }, color: '#6366F1', priority: 2 },
  'summarization': { label: { zh: '摘要', en: 'Summarization' }, color: '#10B981', priority: 2 },
  'translation': { label: { zh: '翻译', en: 'Translation' }, color: '#10B981', priority: 2 },
  'data-analysis': { label: { zh: '数据分析', en: 'Data Analysis' }, color: '#6366F1', priority: 2 },
  'creativity': { label: { zh: '创意', en: 'Creativity' }, color: '#EC4899', priority: 2 },
  'text-to-speech': { label: { zh: '文本转语音', en: 'Text to Speech' }, color: '#EC4899', priority: 2 },
  'speech-to-text': { label: { zh: '语音转文本', en: 'Speech to Text' }, color: '#EC4899', priority: 2 },
  'image-editing': { label: { zh: '图像编辑', en: 'Image Editing' }, color: '#F59E0B', priority: 2 },
  'video-editing': { label: { zh: '视频编辑', en: 'Video Editing' }, color: '#EF4444', priority: 2 },
  'content-generation': { label: { zh: '内容生成', en: 'Content Generation' }, color: '#10B981', priority: 2 },
  'personalization': { label: { zh: '个性化', en: 'Personalization' }, color: '#8B5CF6', priority: 2 },
  'automation': { label: { zh: '自动化', en: 'Automation' }, color: '#6366F1', priority: 2 },
  'conversation': { label: { zh: '对话生成', en: 'Conversation' }, color: '#10B981', priority: 2 },
  
  // 应用场景类
  'marketing': { label: { zh: '营销', en: 'Marketing' }, color: '#EC4899', priority: 3 },
  'customer-support': { label: { zh: '客户支持', en: 'Customer Support' }, color: '#EC4899', priority: 3 },
  'productivity': { label: { zh: '生产力', en: 'Productivity' }, color: '#8B5CF6', priority: 3 },
  'e-commerce': { label: { zh: '电子商务', en: 'E-commerce' }, color: '#EC4899', priority: 3 },
  'education': { label: { zh: '教育', en: 'Education' }, color: '#0EA5E9', priority: 3 },
  'entertainment': { label: { zh: '娱乐', en: 'Entertainment' }, color: '#F59E0B', priority: 3 },
  'business': { label: { zh: '商业', en: 'Business' }, color: '#6366F1', priority: 3 },
  'social-media': { label: { zh: '社交媒体', en: 'Social Media' }, color: '#EC4899', priority: 3 },
  'healthcare': { label: { zh: '医疗健康', en: 'Healthcare' }, color: '#10B981', priority: 3 },
  'finance': { label: { zh: '金融', en: 'Finance' }, color: '#6366F1', priority: 3 },
  'legal': { label: { zh: '法律', en: 'Legal' }, color: '#8B5CF6', priority: 3 },
  'research-tool': { label: { zh: '研究工具', en: 'Research Tool' }, color: '#6366F1', priority: 3 },
};

export function getAiTagLabel(tagId: string, locale: TagLocale): string {
  const tag = aiFeatureTags[tagId];
  if (!tag) return tagId;
  return tag.label[locale] || tag.label.zh;
}

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
