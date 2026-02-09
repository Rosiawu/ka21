// 埋点事件类型定义（热门板块）
export interface AnalyticsEvent {
  event_name: string;
  category_key: string;
  category_title: string;
  timestamp: number;
  session_id?: string;
}

export interface HotShuffleEvent extends AnalyticsEvent {
  event_name: 'hot_shuffle';
  page_index_after: number;
  total_tools: number;
  page_size: number;
}

export interface HotClickEvent extends AnalyticsEvent {
  event_name: 'hot_click';
  tool_id: string;
  position: number;
  from: 'hot_section';
  is_featured: boolean; // 是否为精选工具
  recommend_level: string; // 推荐等级：high/medium/low
}

// 未满页事件：当某分类可用工具数量不足以填满一页
export interface HotUnderfillEvent extends AnalyticsEvent {
  event_name: 'hot_underfill';
  displayed_count: number;
  expected_page_size: number;
  reason: 'insufficient-assigned-pool' | 'other';
}

export type HotAnalyticsEvent = HotShuffleEvent | HotClickEvent | HotUnderfillEvent;

// 会话管理（用于拼接 session_id）
class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 埋点管理器（统一投递到控制台/Umami/Clarity）
export class HotAnalytics {
  private sessionManager: SessionManager;
  private isClient: boolean;

  constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.isClient = typeof window !== 'undefined';
  }

  // 发送换一换事件
  public trackShuffle(
    categoryKey: string,
    categoryTitle: string,
    pageIndexAfter: number,
    totalTools: number,
    pageSize: number
  ): void {
    if (!this.isClient) return; // 仅在客户端发送

    const event: HotShuffleEvent = {
      event_name: 'hot_shuffle',
      category_key: categoryKey,
      category_title: categoryTitle,
      page_index_after: pageIndexAfter,
      total_tools: totalTools,
      page_size: pageSize,
      timestamp: Date.now(),
      session_id: this.sessionManager.getSessionId()
    };

    this.sendEvent(event);
  }

  // 发送点击事件
  public trackClick(
    categoryKey: string,
    categoryTitle: string,
    toolId: string,
    position: number,
    isFeatured: boolean,
    recommendLevel: string
  ): void {
    if (!this.isClient) return; // 仅在客户端发送

    const event: HotClickEvent = {
      event_name: 'hot_click',
      category_key: categoryKey,
      category_title: categoryTitle,
      tool_id: toolId,
      position: position,
      from: 'hot_section',
      is_featured: isFeatured,
      recommend_level: recommendLevel,
      timestamp: Date.now(),
      session_id: this.sessionManager.getSessionId()
    };

    this.sendEvent(event);
  }

  // 发送未满页事件（记录每次展示的条数与期望值）
  public trackUnderfill(
    categoryKey: string,
    categoryTitle: string,
    displayedCount: number,
    expectedPageSize: number,
    reason: 'insufficient-assigned-pool' | 'other' = 'insufficient-assigned-pool'
  ): void {
    if (!this.isClient) return;

    const event: HotUnderfillEvent = {
      event_name: 'hot_underfill',
      category_key: categoryKey,
      category_title: categoryTitle,
      displayed_count: displayedCount,
      expected_page_size: expectedPageSize,
      reason,
      timestamp: Date.now(),
      session_id: this.sessionManager.getSessionId()
    };

    this.sendEvent(event);
  }

  // 发送事件到各种统计平台
  private sendEvent(event: HotAnalyticsEvent): void {
    try {
      // 发送到控制台（开发模式）
      if (process.env.NODE_ENV === 'development') {
        console.log('[HotAnalytics]', event);
      }

      // 发送到 Umami（如果可用）
      this.sendToUmami(event);

      // 发送到 Microsoft Clarity（如果可用）
      this.sendToClarity(event);

    } catch (error) {
      console.error('[HotAnalytics] 发送事件失败:', error);
    }
  }

  // 发送到 Umami
  private sendToUmami(event: HotAnalyticsEvent): void {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { umami?: { track: (event: string, data?: Record<string, unknown>) => void } };
      if (!win.umami) return;
      try {
        win.umami.track(event.event_name, {
          category: event.category_title,
          tool_id: event.event_name === 'hot_click' ? (event as HotClickEvent).tool_id : undefined,
          position: event.event_name === 'hot_click' ? (event as HotClickEvent).position : undefined,
          is_featured: event.event_name === 'hot_click' ? (event as HotClickEvent).is_featured : undefined,
          recommend_level: event.event_name === 'hot_click' ? (event as HotClickEvent).recommend_level : undefined,
          page_index: event.event_name === 'hot_shuffle' ? (event as HotShuffleEvent).page_index_after : undefined,
          displayed_count: event.event_name === 'hot_underfill' ? (event as HotUnderfillEvent).displayed_count : undefined,
          expected_page_size: event.event_name === 'hot_underfill' ? (event as HotUnderfillEvent).expected_page_size : undefined,
          reason: event.event_name === 'hot_underfill' ? (event as HotUnderfillEvent).reason : undefined,
          session_id: event.session_id
        });
      } catch (error) {
        console.error('[HotAnalytics] Umami 发送失败:', error);
      }
    }
  }

  // 已移除百度统计对接

  // 发送到 Microsoft Clarity
  private sendToClarity(event: HotAnalyticsEvent): void {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { clarity?: (action: string, name: string, data?: Record<string, unknown>) => void };
      if (!win.clarity) return;
      try {
        const clarity = win.clarity;
        
        // 设置自定义事件
        clarity('event', event.event_name, {
          category: event.category_title,
          tool_id: event.event_name === 'hot_click' ? (event as HotClickEvent).tool_id : undefined,
          position: event.event_name === 'hot_click' ? (event as HotClickEvent).position : undefined,
          page_index: event.event_name === 'hot_shuffle' ? (event as HotShuffleEvent).page_index_after : undefined,
          displayed_count: event.event_name === 'hot_underfill' ? (event as HotUnderfillEvent).displayed_count : undefined,
          expected_page_size: event.event_name === 'hot_underfill' ? (event as HotUnderfillEvent).expected_page_size : undefined,
          reason: event.event_name === 'hot_underfill' ? (event as HotUnderfillEvent).reason : undefined,
          session_id: event.session_id
        });
      } catch (error) {
        console.error('[HotAnalytics] Clarity 发送失败:', error);
      }
    }
  }
}

// 创建全局实例
export const hotAnalytics = new HotAnalytics();

// 便捷的hook函数（用于React组件）
export function useHotAnalytics() {
  return {
    trackShuffle: (
      categoryKey: string,
      categoryTitle: string,
      pageIndexAfter: number,
      totalTools: number,
      pageSize: number
    ) => {
      hotAnalytics.trackShuffle(categoryKey, categoryTitle, pageIndexAfter, totalTools, pageSize);
    },

    trackClick: (
      categoryKey: string,
      categoryTitle: string,
      toolId: string,
      position: number,
      isFeatured: boolean,
      recommendLevel: string
    ) => {
      hotAnalytics.trackClick(categoryKey, categoryTitle, toolId, position, isFeatured, recommendLevel);
    },

    trackUnderfill: (
      categoryKey: string,
      categoryTitle: string,
      displayedCount: number,
      expectedPageSize: number,
      reason: 'insufficient-assigned-pool' | 'other' = 'insufficient-assigned-pool'
    ) => {
      hotAnalytics.trackUnderfill(categoryKey, categoryTitle, displayedCount, expectedPageSize, reason);
    }
  };
}

// 防抖函数（用于优化点击事件）
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// 节流函数（用于限制事件发送频率）
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
