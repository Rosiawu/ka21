/**
 * 技能标签组件
 * 用于在教程卡片上显示与教程相关的技能或工具标签
 */
export default function SkillTag({ tag }: { tag: string }) {
  // 为不同类型的标签设置不同的颜色样式
  const getColorByTag = (tag: string) => {
    // 工具相关颜色
    if (tag.includes('DeepSeek')) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    if (tag.includes('Claude')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (tag.includes('ChatGPT')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (tag.includes('Midjourney')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    if (tag.includes('Stable') || tag.includes('DALL-E')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    if (tag.includes('飞书')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    
    // 技能相关颜色
    if (tag.includes('提示词')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (tag.includes('文本') || tag.includes('写作')) return 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400';
    if (tag.includes('图像') || tag.includes('绘画')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    if (tag.includes('数据')) return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    if (tag.includes('代码') || tag.includes('编程')) return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
    
    // 默认颜色
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  // 获取简短标签文本（如果过长）
  const getShortTagName = (tag: string) => {
    // 特定缩写规则
    if (tag === '提示词工程') return 'Prompt';
    if (tag === '文本生成') return '文本';
    if (tag === '图像生成') return '图像';
    return tag;
  };

  return (
    <span 
      className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${getColorByTag(tag)}`}
      title={tag}
    >
      {getShortTagName(tag)}
    </span>
  );
} 