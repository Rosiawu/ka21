'use client';

import React from 'react';
import { AccessibilityType } from '@/lib/types';
import {useTranslations} from 'next-intl';

interface AccessibilityBadgeProps {
  accessibility: AccessibilityType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'rounded';
}

function AccessibilityBadge({ 
  accessibility, 
  size = 'md', 
  variant = 'pill' 
}: AccessibilityBadgeProps) {
  const tAccess = useTranslations('Access');
  
  // 根据可访问性确定样式
  const getColorClasses = (accessibility: AccessibilityType) => {
    switch (accessibility) {
      case '直接访问':
        return 'bg-green-100 text-green-600';
      case '需要代理':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 根据可访问性确定标签文本
  const getLabel = (accessibility: AccessibilityType) => {
    switch (accessibility) {
      case '直接访问':
        return tAccess('direct');
      case '需要代理':
        return tAccess('proxy');
      default:
        return accessibility;
    }
  };
  
  // 获取图标
  const getIcon = (accessibility: AccessibilityType) => {
    switch (accessibility) {
      case '直接访问':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case '需要代理':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // 根据尺寸确定样式
  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'text-xs px-1.5 py-0.5';
      case 'md':
        return 'text-sm px-2 py-0.5';
      case 'lg':
        return 'text-sm px-2.5 py-1';
      default:
        return 'text-sm px-2 py-0.5';
    }
  };
  
  // 根据变体确定圆角
  const getVariantClasses = (variant: 'pill' | 'rounded') => {
    switch (variant) {
      case 'pill':
        return 'rounded-full';
      case 'rounded':
        return 'rounded';
      default:
        return 'rounded-full';
    }
  };
  
  const colorClasses = getColorClasses(accessibility);
  const sizeClasses = getSizeClasses(size);
  const variantClasses = getVariantClasses(variant);
  const label = getLabel(accessibility);
  const icon = getIcon(accessibility);
  
  return (
    <span className={`inline-flex items-center ${colorClasses} ${sizeClasses} ${variantClasses} font-medium transition-opacity hover:opacity-80`}>
      {icon}
      {label}
    </span>
  );
}

// 使用React.memo优化组件性能，避免不必要的重渲染
export default React.memo(AccessibilityBadge); 
