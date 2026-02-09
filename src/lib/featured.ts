import { Tool } from '@/lib/types';
import { FeaturedConfig, FeaturedCategory } from '@/types/featured';

export interface FeaturedToolWithMeta {
  tool: Tool;
  isFeatured: boolean;
  position?: number;
}

export interface CategoryTools {
  category: FeaturedCategory;
  tools: FeaturedToolWithMeta[];
  backupPool: Tool[];
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  deck: string[]; // 洗牌后的工具ID数组
}

export class FeaturedToolsManager {
  private config: FeaturedConfig;
  private allTools: Tool[];
  private sessionStorage: Storage;
  private static GLOBAL_STATE_KEY = 'hotrec:global:current';
  private static GLOBAL_ASSIGN_KEY = 'hotrec:global:assignment';
  private enableGlobalDedup: boolean;
  private enableCategoryLocking: boolean;

  constructor(config: FeaturedConfig, tools: Tool[]) {
    this.config = config;
    this.allTools = tools.filter(tool => tool.isVisible);
    this.sessionStorage = typeof window !== 'undefined' ? sessionStorage : this.createMockStorage();
    // Feature flags (build-time replacement via NEXT_PUBLIC_*)
    this.enableGlobalDedup = (process.env.NEXT_PUBLIC_HOT_GLOBAL_DEDUP ?? 'true') !== 'false';
    this.enableCategoryLocking = (process.env.NEXT_PUBLIC_HOT_CATEGORY_LOCKING ?? 'true') !== 'false';
  }

  // 为SSR环境创建模拟存储
  private createMockStorage(): Storage {
    const mockStorage: Record<string, string> = {};
    let storageLength = 0;
    return {
      get length() { return storageLength; },
      clear: () => { 
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]); 
        storageLength = 0; 
      },
      getItem: (key) => mockStorage[key] || null,
      key: (index) => Object.keys(mockStorage)[index] || null,
      removeItem: (key) => { 
        delete mockStorage[key]; 
        storageLength = Object.keys(mockStorage).length; 
      },
      setItem: (key, value) => { 
        mockStorage[key] = value; 
        storageLength = Object.keys(mockStorage).length; 
      },
    };
  }

  // 获取所有分类的工具
  public getCategoryTools(): CategoryTools[] {
    const result: CategoryTools[] = [];

    for (const [, category] of Object.entries(this.config.categories)) {
      const featuredTools = this.getFeaturedTools(category);
      const backupPool = this.getBackupPool(category);
      
      result.push({
        category,
        tools: featuredTools,
        backupPool
      });
    }

    return result;
  }

  // 获取首屏工具（SSR友好）
  public getInitialDisplayTools(categoryKey: string, pageSize: number): FeaturedToolWithMeta[] {
    const category = this.config.categories[categoryKey];
    if (!category) return [];

    const assignedSet = this.getAssignedSetForCategory(categoryKey);
    const featuredTools = this.getFeaturedTools(category)
      .filter(item => assignedSet.has(item.tool.id));
    const backupPool = this.getBackupPool(category);
    
    // 优先显示featured工具，不足时从backupPool补充
    const displayTools = [...featuredTools];
    
    if (displayTools.length < pageSize) {
      const needed = pageSize - displayTools.length;
      const supplementTools = backupPool.slice(0, needed).map(tool => ({
        tool,
        isFeatured: false
      }));
      displayTools.push(...supplementTools);
    }

    // B2: 若仍不足，允许少于 pageSize
    return displayTools.slice(0, pageSize);
  }

  // 获取分页工具（客户端）
  public getPaginatedTools(categoryKey: string, pageSize: number, opts?: { excludeGlobal?: boolean }): {
    tools: FeaturedToolWithMeta[];
    state: PaginationState;
    canRefresh: boolean;
  } {
    const category = this.config.categories[categoryKey];
    if (!category) {
      return {
        tools: [],
        state: this.createEmptyState(pageSize),
        canRefresh: false
      };
    }

    // 获取或创建分页状态
    let state = this.getPaginationState(categoryKey, pageSize);
    
    // 如果是首次访问或页大小改变，重新初始化
    if (state.deck.length === 0 || state.pageSize !== pageSize) {
      state = this.initializePaginationState(categoryKey, pageSize);
    }

    // 获取当前页的候选工具
    const startIndex = state.pageIndex * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    const pageToolIds = state.deck.slice(startIndex, endIndex);

    // 计算排除集（其它分类当前显示）
    const excludeGlobal = opts?.excludeGlobal !== false; // 默认启用全局去重
    const excludeSet = excludeGlobal ? this.getExcludedIdsForCategory(categoryKey) : new Set<string>();

    // 先按当前页候选顺序过滤
    const selected: string[] = [];
    for (const id of pageToolIds) {
      if (!excludeSet.has(id) && !selected.includes(id)) {
        selected.push(id);
      }
      if (selected.length >= pageSize) break;
    }

    // 数量不足时，从 deck 剩余（本页之外）按顺序补齐
    if (selected.length < pageSize) {
      for (let i = 0; i < state.deck.length && selected.length < pageSize; i++) {
        const id = state.deck[i];
        if (i >= startIndex && i < endIndex) continue; // 已处理本页
        if (!excludeSet.has(id) && !selected.includes(id)) {
          selected.push(id);
        }
      }
    }

    // 仍不足，使用 backupPool 补齐
    if (selected.length < pageSize) {
      const backupPool = this.getBackupPool(category);
      for (const tool of backupPool) {
        if (selected.length >= pageSize) break;
        if (!excludeSet.has(tool.id) && !selected.includes(tool.id)) {
          selected.push(tool.id);
        }
      }
    }

    // B1 阶段：不做跨分类 allTools 兜底；不足时允许少于 pageSize

    // 查找对应的工具对象
    const tools = selected.map(toolId => {
      const tool = this.allTools.find(t => t.id === toolId);
      const isFeatured = category.featured_tools.includes(toolId);
      return {
        tool: tool!,
        isFeatured,
        position: selected.indexOf(toolId) + 1
      };
    }).filter(item => item.tool); // 过滤掉可能不存在的工具

    return {
      tools,
      state,
      canRefresh: state.totalPages > 1
    };
  }

  // 换一换功能
  public refreshCategory(categoryKey: string, pageSize: number): {
    tools: FeaturedToolWithMeta[];
    state: PaginationState;
  } {
    const state = this.getPaginationState(categoryKey, pageSize);
    
    // 计算下一页
    const nextPageIndex = (state.pageIndex + 1) % state.totalPages;
    
    // 更新状态
    const newState = {
      ...state,
      pageIndex: nextPageIndex
    };
    
    this.savePaginationState(categoryKey, newState);

    // 计算新页并更新全局展示状态
    const result = this.getPaginatedTools(categoryKey, pageSize, { excludeGlobal: true });
    this.updateGlobalDisplayState(categoryKey, result.tools.map(t => t.tool.id));
    return result;
  }

  // 获取featured工具
  private getFeaturedTools(category: FeaturedCategory): FeaturedToolWithMeta[] {
    const categoryKey = this.getCategoryKeyByCategory(category);
    const assignedSet = this.getAssignedSetForCategory(categoryKey);
    return category.featured_tools
      .map(toolId => {
        const tool = this.allTools.find(t => t.id === toolId);
        if (!tool) return null;
        // 仅保留归属于该分类的 featured 工具
        if (!assignedSet.has(tool.id)) return null;
        return { tool, isFeatured: true };
      })
      .filter((item): item is FeaturedToolWithMeta => item !== null);
  }

  // 获取兜底池
  private getBackupPool(category: FeaturedCategory): Tool[] {
    // B2：仅从归属为该分类的工具中选择非精选作为备选池
    const categoryKey = this.getCategoryKeyByCategory(category);
    const assignedSet = this.getAssignedSetForCategory(categoryKey);

    const pool = this.allTools.filter(tool => {
      if (!assignedSet.has(tool.id)) return false;
      if (category.featured_tools.includes(tool.id)) return false;
      return true;
    });

    // 按推荐等级排序（medium > low > high > undefined），其次按名称
    return pool.sort((a, b) => {
      const levelOrder = { medium: 4, low: 3, high: 2, undefined: 1 };
      const aLevel = (a.recommendLevel || 'undefined') as keyof typeof levelOrder;
      const bLevel = (b.recommendLevel || 'undefined') as keyof typeof levelOrder;
      const levelDiff = levelOrder[bLevel] - levelOrder[aLevel];
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name);
    });
  }

  private getCategoryKeyByCategory(category: FeaturedCategory): string {
    // 根据标题匹配配置中的 categoryKey（假设标题唯一）
    for (const [key, cat] of Object.entries(this.config.categories)) {
      if (cat.title === category.title) return key;
    }
    // 兜底：返回第一个键（不应发生）
    return Object.keys(this.config.categories)[0];
  }

  // 初始化分页状态
  private initializePaginationState(categoryKey: string, pageSize: number): PaginationState {
    const category = this.config.categories[categoryKey];
    const backupPool = this.getBackupPool(category);
    const assignedSet = new Set(this.getToolsAssignedTo(categoryKey));
    
    // 构建首页显示的工具（2个精选 + 1个非精选）
    const featuredToolIds = category.featured_tools
      .filter(id => assignedSet.has(id))
      .slice(0, 2); // 每个分类最多2个精选（且必须归属于本分类）
    const nonFeaturedToolIds = backupPool.slice(0, 1).map(tool => tool.id); // 1个非精选
    
    // 构建后续页面的工具池（给非精选更多机会）
    const remainingFeatured = category.featured_tools
      .filter(id => assignedSet.has(id))
      .slice(2);
    const remainingNonFeatured = backupPool.slice(1).map(tool => tool.id);
    
    // 首页按固定比例排列：2个精选 + 1个非精选
    const firstPageTools = [...featuredToolIds, ...nonFeaturedToolIds];
    
    // 后续页面混合展示，给非精选更多机会
    const subsequentTools = this.fisherYatesShuffle([
      ...remainingFeatured,
      ...remainingNonFeatured
    ]);
    
    // 构建完整的工具池
    const allToolIds = [...firstPageTools, ...subsequentTools];
    
    const totalPages = Math.ceil(allToolIds.length / pageSize);
    
    const state: PaginationState = {
      pageIndex: 0,
      pageSize,
      totalPages,
      deck: allToolIds
    };

    this.savePaginationState(categoryKey, state);
    return state;
  }

  // Fisher-Yates洗牌算法
  private fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 获取分页状态
  private getPaginationState(categoryKey: string, pageSize: number): PaginationState {
    const key = `hotrec:${categoryKey}:state`;
    const stored = this.sessionStorage.getItem(key);
    
    if (stored) {
      try {
        const state = JSON.parse(stored);
        // 如果页大小改变，重新初始化
        if (state.pageSize !== pageSize) {
          return this.initializePaginationState(categoryKey, pageSize);
        }
        return state;
      } catch {
        // 解析失败，重新初始化
        return this.initializePaginationState(categoryKey, pageSize);
      }
    }
    
    return this.initializePaginationState(categoryKey, pageSize);
  }

  // 保存分页状态
  private savePaginationState(categoryKey: string, state: PaginationState): void {
    const key = `hotrec:${categoryKey}:state`;
    this.sessionStorage.setItem(key, JSON.stringify(state));
  }

  // 创建空状态
  private createEmptyState(pageSize: number): PaginationState {
    return {
      pageIndex: 0,
      pageSize,
      totalPages: 1,
      deck: []
    };
  }

  // 获取响应式页大小
  public static getResponsivePageSize(): number {
    // 根据产品决策文档要求，统一每个分类显示3个工具
    return 3;
  }

  // 清理会话存储（可选）
  public clearSessionStorage(): void {
    const keysToRemove = Object.keys(this.sessionStorage)
      .filter(key => key.startsWith('hotrec:'));
    
    keysToRemove.forEach(key => {
      this.sessionStorage.removeItem(key);
    });
  }

  // -------- 全局状态（跨分类去重）--------
  private getGlobalDisplayState(): { categoryCurrentTools: Record<string, string[]> } {
    try {
      const stored = this.sessionStorage.getItem(FeaturedToolsManager.GLOBAL_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.categoryCurrentTools) {
          return parsed;
        }
      }
    } catch {}
    return { categoryCurrentTools: {} };
  }

  private setGlobalDisplayState(state: { categoryCurrentTools: Record<string, string[]> }): void {
    this.sessionStorage.setItem(FeaturedToolsManager.GLOBAL_STATE_KEY, JSON.stringify(state));
  }

  public updateGlobalDisplayState(categoryKey: string, toolIds: string[]): void {
    if (!this.enableGlobalDedup) return;
    const state = this.getGlobalDisplayState();
    state.categoryCurrentTools[categoryKey] = toolIds;
    this.setGlobalDisplayState(state);
  }

  private getExcludedIdsForCategory(categoryKey: string): Set<string> {
    if (!this.enableGlobalDedup) return new Set<string>();
    const state = this.getGlobalDisplayState();
    const exclude = new Set<string>();
    for (const [key, ids] of Object.entries(state.categoryCurrentTools)) {
      if (key !== categoryKey) {
        ids.forEach(id => exclude.add(id));
      }
    }
    return exclude;
  }

  // -------- 主分类锁定（工具归属）--------
  private getAssignment(): Record<string, string> {
    if (!this.enableCategoryLocking) {
      // When locking disabled, treat as unassigned (handled by getAssignedSetForCategory)
      return {};
    }
    try {
      const stored = this.sessionStorage.getItem(FeaturedToolsManager.GLOBAL_ASSIGN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    const built = this.buildAssignment();
    this.setAssignment(built);
    return built;
  }

  private setAssignment(map: Record<string, string>): void {
    this.sessionStorage.setItem(FeaturedToolsManager.GLOBAL_ASSIGN_KEY, JSON.stringify(map));
  }

  private buildAssignment(): Record<string, string> {
    const assignment: Record<string, string> = {};
    const order: string[] = this.config.order || Object.keys(this.config.categories);

    for (const tool of this.allTools) {
      // 优先使用工具内置主分类
      if (tool.hotPrimaryCategory && this.config.categories[tool.hotPrimaryCategory]) {
        assignment[tool.id] = tool.hotPrimaryCategory;
        continue;
      }

      // 优先：featured 命中（按 config.order 的先后）
      let featuredChosen: string | null = null;
      for (const key of order) {
        const cat = this.config.categories[key];
        if (cat.featured_tools.includes(tool.id)) { featuredChosen = key; break; }
      }
      if (featuredChosen) { assignment[tool.id] = featuredChosen; continue; }

      // 匹配度：backup_categories（+2） + backup_tags（每命中 +1）
      let bestKey = '';
      let bestScore = -1;
      for (const key of order) {
        const cat = this.config.categories[key];
        let score = 0;
        if (cat.backup_categories && tool.toolCategory && cat.backup_categories.includes(tool.toolCategory)) {
          score += 2;
        }
        if (cat.backup_tags && tool.tags && tool.tags.length) {
          for (const tag of cat.backup_tags) {
            if (tool.tags.includes(tag)) score += 1;
          }
        }
        if (score > bestScore) { bestScore = score; bestKey = key; }
      }

      if (bestScore > 0) {
        assignment[tool.id] = bestKey;
      } else {
        // 最后：按 config.order 的首个分类
        assignment[tool.id] = order[0];
      }
    }

    return assignment;
  }

  private resolvePrimaryCategory(toolId: string): string {
    const map = this.getAssignment();
    return map[toolId];
  }

  private getToolsAssignedTo(categoryKey: string): string[] {
    const map = this.getAssignment();
    return Object.entries(map).filter(([, key]) => key === categoryKey).map(([id]) => id);
  }

  private getAssignedSetForCategory(categoryKey: string): Set<string> {
    if (!this.enableCategoryLocking) {
      return new Set(this.allTools.map(t => t.id));
    }
    return new Set(this.getToolsAssignedTo(categoryKey));
  }
}

// 工具函数：获取页大小
export function getPageSize(): number {
  return FeaturedToolsManager.getResponsivePageSize();
}

// 工具函数：检查是否可以刷新
export function canRefreshCategory(categoryKey: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionStorage = window.sessionStorage;
    const key = `hotrec:${categoryKey}:state`;
    const stored = sessionStorage.getItem(key);
    
    if (!stored) return false;
    
    const state = JSON.parse(stored);
    return state.totalPages > 1;
  } catch {
    return false;
  }
}
