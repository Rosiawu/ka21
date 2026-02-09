'use client';

import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

interface ClarityAnalyticsProps {
  projectId: string;
  enableConsent?: boolean;
}

export default function ClarityAnalytics({ 
  projectId, 
  enableConsent = true 
}: ClarityAnalyticsProps) {
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log('🔍 Clarity组件开始初始化...');
      console.log('📋 项目ID:', projectId);
      console.log('🌐 窗口对象存在:', typeof window !== 'undefined');
      console.log('📦 Clarity库存在:', !!clarity);
    }
    
    // 初始化 Clarity
    if (projectId && projectId !== 'your-clarity-project-id' && typeof window !== 'undefined') {
      try {
        if (isDevelopment) {
          console.log('🚀 开始初始化 Clarity...');
        }
        
        if (clarity && clarity.init) {
          clarity.init(projectId);
        
          if (isDevelopment) {
            console.log('✅ Clarity.init() 调用成功');
          }
        }
        
        // 如果启用了同意，设置 cookie 同意
        if (enableConsent) {
          clarity.consent(true);
          if (isDevelopment) {
            console.log('🍪 Cookie 同意已设置');
          }
        }
        
        // 设置自定义标签，用于识别网站类型
        if (clarity && clarity.setTag) {
          clarity.setTag('site_type', 'ka21-tools');
          clarity.setTag('platform', 'nextjs');
          clarity.setTag('env', isDevelopment ? 'development' : 'production');
        }
        
        if (isDevelopment) {
          console.log('🏷️ 自定义标签已设置');
          console.log('🎉 Clarity initialized successfully');
          
          // 只在开发环境发送测试事件
          setTimeout(() => {
            try {
              if (clarity && clarity.event) {
                clarity.event('clarity_auto_test');
                console.log('📊 自动测试事件已发送');
              }
            } catch (err) {
              console.error('❌ 发送测试事件失败:', err);
            }
          }, 1000);
        }
        
      } catch (error) {
        // 生产环境也需要记录错误，但使用更简洁的信息
        if (isDevelopment) {
          console.error('❌ Failed to initialize Clarity:', error);
        } else {
          console.error('Clarity initialization failed:', error);
        }
      }
    } else {
      if (isDevelopment) {
        if (!projectId) {
          console.warn('⚠️ 项目ID未设置');
        }
        if (typeof window === 'undefined') {
          console.log('🔄 服务器端渲染，跳过初始化');
        }
      }
    }
  }, [projectId, enableConsent]);

  // 这个组件不需要渲染任何内容
  return null;
}

// 导出 Clarity 实例，供其他组件使用
export { clarity };
