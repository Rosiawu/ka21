'use client';

import { useState, useEffect } from 'react';

/**
 * 响应式媒体查询钩子
 * @param query - CSS媒体查询字符串，例如 '(max-width: 767px)'
 * @returns 布尔值，表示当前视口是否匹配查询条件
 * 
 * @example
 * // 检查是否为移动设备
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * 
 * // 根据查询结果应用不同的样式
 * <div className={isMobile ? 'mobile-class' : 'desktop-class'}>
 *   Responsive content
 * </div>
 */
export function useMediaQuery(query: string): boolean {
  // 初始状态基于当前媒体查询匹配状态
  const getMatches = (): boolean => {
    // 在服务器端渲染时，始终返回false
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // 避免在服务器端执行
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(query);
    const updateMatches = (): void => setMatches(mediaQuery.matches);

    // 初始化匹配状态
    updateMatches();

    // 监听媒体查询状态变化
    // 使用标准方法和旧方法以支持更多浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
    } else {
      // 使用类型断言处理旧版浏览器API
      const legacyMediaQuery = mediaQuery as unknown as {
        addListener: (listener: (ev: MediaQueryListEvent) => void) => void;
      };
      legacyMediaQuery.addListener(updateMatches);
    }

    // 清理监听器
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatches);
      } else {
        // 使用类型断言处理旧版浏览器API
        const legacyMediaQuery = mediaQuery as unknown as {
          removeListener: (listener: (ev: MediaQueryListEvent) => void) => void;
        };
        legacyMediaQuery.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery; 