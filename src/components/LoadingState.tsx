"use client"; // 客户端组件：加载状态提示，支持本地化

import React from 'react';
import {useTranslations} from 'next-intl';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 加载状态组件
 * 用于显示正在加载的状态，提升用户体验
 */
const LoadingState: React.FC<LoadingStateProps> = ({ 
  message,
  size = 'md'
}) => {
  const tCommon = useTranslations('Common');
  // 根据size属性设置不同的尺寸
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${spinnerSizes[size]} text-primary-500 animate-spin mb-3`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p className={`${textSizes[size]} text-neutral-600 dark:text-neutral-400`}>{message ?? tCommon('loading')}</p>
    </div>
  );
};

// 使用React.memo优化性能
export default React.memo(LoadingState); 
