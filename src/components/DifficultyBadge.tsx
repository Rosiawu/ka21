import { DifficultyLevel } from '@/data/tutorials';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 教程难度级别标签组件
 * 根据不同难度级别显示不同的颜色和图标
 */
export default function DifficultyBadge({ level, size = 'md' }: DifficultyBadgeProps) {
  // 根据难度级别设置颜色和图标
  const getStyleByLevel = (level: DifficultyLevel) => {
    const styleMap: Record<DifficultyLevel, { bg: string, text: string, icon: string }> = {
      '小白入门': {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        icon: 'fa-seedling'
      },
      '萌新进阶': {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'fa-graduation-cap'
      },
      '高端玩家': {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
        icon: 'fa-crown'
      }
    };
    
    // 如果找不到对应的级别样式，返回默认样式
    if (!styleMap[level]) {
      console.warn(`未找到难度级别 "${level}" 的样式配置，使用默认样式`);
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-400',
        icon: 'fa-question-circle'
      };
    }
    
    return styleMap[level];
  };

  const { bg, text, icon } = getStyleByLevel(level);
  
  // 根据大小设置样式
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center rounded-full ${bg} ${text} font-medium ${sizeClasses[size]}`}>
      <i className={`fas ${icon} mr-1`}></i>
      <span>{level}</span>
    </span>
  );
} 