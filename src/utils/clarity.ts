import clarity from '@microsoft/clarity';

/**
 * Clarity 分析工具函数
 * 提供便捷的 API 调用方法
 */

// 检查是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

const devError = (...args: unknown[]) => {
  if (isDevelopment) {
    console.error(...args);
  } else {
    // 生产环境只记录简单错误信息
    console.error('Clarity operation failed');
  }
};

// 设置用户标识
export function identifyUser(
  customId: string, 
  customSessionId?: string, 
  customPageId?: string, 
  friendlyName?: string
) {
  try {
    if (clarity && clarity.identify) {
      clarity.identify(customId, customSessionId, customPageId, friendlyName);
    }
  } catch (error) {
    devError('Failed to identify user in Clarity:', error);
  }
}

// 设置自定义标签
export function setTag(key: string, value: string | string[]) {
  try {
    if (clarity && clarity.setTag) {
      clarity.setTag(key, value);
    }
  } catch (error) {
    devError('Failed to set tag in Clarity:', error);
  }
}

// 记录自定义事件
export function trackEvent(eventName: string) {
  try {
    if (clarity && clarity.event) {
      clarity.event(eventName);
    }
  } catch (error) {
    devError('Failed to track event in Clarity:', error);
  }
}

// 设置 cookie 同意
export function setConsent(consent: boolean = true) {
  try {
    if (clarity && clarity.consent) {
      clarity.consent(consent);
    }
  } catch (error) {
    devError('Failed to set consent in Clarity:', error);
  }
}

// 升级会话优先级
export function upgradeSession(reason: string) {
  try {
    if (clarity && clarity.upgrade) {
      clarity.upgrade(reason);
    }
  } catch (error) {
    devError('Failed to upgrade session in Clarity:', error);
  }
}

// 页面浏览跟踪
export function trackPageView(pageName: string, pageId?: string) {
  try {
    // 设置页面标识
    if (pageId && clarity && clarity.identify) {
      clarity.identify('', '', pageId);
    }
    
    // 设置页面标签
    setTag('page_name', pageName);
    
    // 记录页面浏览事件
    trackEvent('page_view');
  } catch (error) {
    devError('Failed to track page view in Clarity:', error);
  }
}

// 用户行为跟踪
export function trackUserAction(action: string, details?: Record<string, string>) {
  try {
    // 记录用户行为事件
    trackEvent(`user_action_${action}`);
    
    // 如果有详细信息，设置为标签
    if (details) {
      Object.entries(details).forEach(([key, value]) => {
        setTag(`action_${key}`, value);
      });
    }
  } catch (error) {
    devError('Failed to track user action in Clarity:', error);
  }
}
