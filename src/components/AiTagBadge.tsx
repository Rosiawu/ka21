'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { aiFeatureTags } from '@/lib/aiTags';

interface AiTagBadgeProps {
  tagId: string;
  size?: 'sm' | 'md' | 'lg';
}

const AiTagBadge: React.FC<AiTagBadgeProps> = ({ 
  tagId,
  size = 'sm'
}) => {
  // 获取标签信息，如果不存在则使用默认值
  const tagInfo = aiFeatureTags[tagId] || { 
    name: tagId, 
    color: '#6B7280', 
    priority: 99 
  };

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 基础样式在浅色主题下使用，useMemo 避免重复计算。
  const baseStyle = useMemo(() => ({
    backgroundColor: `${tagInfo.color}15`, // 使用15%透明度的背景色
    color: tagInfo.color,
    borderColor: `${tagInfo.color}30`, // 使用30%透明度的边框色
    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s', // 添加过渡动画
  }), [tagInfo.color]);

  // 暗黑主题时叠加覆盖，提高对比度。
  const darkModeStyle = useMemo(() => ({
    backgroundColor: `${tagInfo.color}30`, // 提高背景透明度到30%
    color: adjustColorBrightness(tagInfo.color, 40), // 提高文字亮度
    borderColor: `${tagInfo.color}50`, // 提高边框透明度到50%
  }), [tagInfo.color]);

  // Hydration 后才能读取主题，防止服务器与客户端样式不匹配。
  const style = useMemo(() => {
    if (mounted && resolvedTheme === 'dark') {
      return { ...baseStyle, ...darkModeStyle };
    }
    return baseStyle;
  }, [baseStyle, darkModeStyle, mounted, resolvedTheme]);

  // 根据size属性设置不同的样式类
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-md border ${sizeClasses[size]} hover:bg-opacity-25 hover:shadow-sm`}
      style={style}
      title={tagInfo.name} // 添加标题属性，提高可访问性
    >
      {tagInfo.name}
    </span>
  );
};

// 调整颜色亮度的工具函数
function adjustColorBrightness(color: string, percent: number): string {
  // 如果颜色格式是十六进制
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // 提高RGB值，最大为255
    const newR = Math.min(255, r + (255 - r) * (percent / 100));
    const newG = Math.min(255, g + (255 - g) * (percent / 100));
    const newB = Math.min(255, b + (255 - b) * (percent / 100));
    
    // 转回十六进制
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  }
  
  // 对于其他颜色格式，直接返回原色
  return color;
}

// 使用React.memo优化组件性能，避免不必要的重渲染
// 只有当tagId或size属性变化时才会重新渲染
export default React.memo(AiTagBadge); 
