"use client"; // 客户端组件：错误状态显示，支持本地化文案

import React from 'react';
import {useTranslations} from 'next-intl';

interface ErrorStateProps {
  message?: string;
  retryAction?: () => void;
}

/**
 * 错误状态组件
 * 用于显示错误信息，并提供重试操作
 */
const ErrorState: React.FC<ErrorStateProps> = ({ 
  message,
  retryAction
}) => {
  const tCommon = useTranslations('Common');
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-neutral-700 dark:text-neutral-300 mb-4 max-w-md">{message ?? tCommon('loadFailed')}</p>
      
      {retryAction && (
        <button 
          onClick={retryAction}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          {tCommon('retry')}
        </button>
      )}
    </div>
  );
};

// 使用React.memo优化性能
export default React.memo(ErrorState); 
