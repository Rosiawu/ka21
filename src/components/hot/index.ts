// 热门推荐组件导出
export { HotSection } from './HotSection';
export { HotCategory } from './HotCategory';
export { HotToolCard } from './HotToolCard';

// 工具函数和类型导出
export type {
  FeaturedConfig,
  FeaturedCategory,
  ValidationResult,
  FeaturedTools
} from '@/types/featured';

export type {
  FeaturedToolWithMeta,
  CategoryTools,
  PaginationState
} from '@/lib/featured';

export {
  FeaturedToolsManager,
  getPageSize,
  canRefreshCategory
} from '@/lib/featured';

// 埋点相关导出
export type {
  AnalyticsEvent,
  HotShuffleEvent,
  HotClickEvent,
  HotAnalyticsEvent
} from '@/lib/hot-analytics';

export {
  hotAnalytics,
  useHotAnalytics,
  debounce,
  throttle
} from '@/lib/hot-analytics';