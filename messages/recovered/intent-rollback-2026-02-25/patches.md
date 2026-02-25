### 2026-02-25T02:38:48.577Z call_WCT83sFEYYn1AMa1pnOakDVD
*** Begin Patch
*** Add File: src/data/searchIntents.ts
+import { ToolCategoryId } from "@/lib/types";
+
+export interface SearchIntentRule {
+  id: string;
+  label: string;
+  keywords: string[];
+  relatedQueries: string[];
+  toolCategories?: ToolCategoryId[];
+  toolTags?: string[];
+  tutorialCategories?: string[];
+  tutorialKeywords?: string[];
+  boostToolIds?: string[];
+  boostTutorialIds?: string[];
+}
+
+export const HOT_SEARCH_QUERIES: string[] = [
+  "DeepSeek",
+  "ChatGPT",
+  "Claude",
+  "AI绘画",
+  "AI视频",
+  "PPT",
+  "飞书多维表格",
+  "AI编程",
+  "智能体",
+  "效率工具",
+];
+
+export const SEARCH_INTENT_RULES: SearchIntentRule[] = [
+  {
+    id: "office-efficiency",
+    label: "办公提效",
+    keywords: ["效率", "办公", "workflow", "自动化", "日报", "表格", "飞书", "office"],
+    relatedQueries: ["效率工具", "飞书多维表格", "自动化工作流", "办公AI"],
+    toolCategories: ["office", "utils", "writing"],
+    toolTags: ["productivity", "automation", "office", "collaboration"],
+    tutorialCategories: ["AI效率", "AI办公", "飞书多维表格"],
+    tutorialKeywords: ["效率", "飞书", "自动化", "工作流", "表格"],
+    boostToolIds: ["tongyi-efficiency", "feishu-base", "ima", "mineru"],
+  },
+  {
+    id: "ppt-doc",
+    label: "PPT与文档",
+    keywords: ["ppt", "演示", "文档", "汇报", "课件", "slide"],
+    relatedQueries: ["PPT", "AI课件", "演示文稿", "文档生成"],
+    toolCategories: ["office", "image", "writing"],
+    toolTags: ["presentation", "content-generation", "productivity"],
+    tutorialCategories: ["AI效率", "AI办公"],
+    tutorialKeywords: ["PPT", "课件", "文档", "汇报"],
+    boostToolIds: ["gamma", "anygen", "freedraw"],
+  },
+  {
+    id: "writing-copy",
+    label: "写作与文案",
+    keywords: ["写作", "文案", "公众号", "总结", "润色", "翻译", "笔记", "copywriting"],
+    relatedQueries: ["AI写作", "文案生成", "公众号排版", "内容总结"],
+    toolCategories: ["writing", "office"],
+    toolTags: ["ai-writing", "content-generation", "summarization", "translation"],
+    tutorialCategories: ["AI效率", "AI大模型"],
+    tutorialKeywords: ["写作", "文案", "总结", "提示词"],
+    boostToolIds: ["chatgpt", "claude", "deepseek", "doubao", "getbiji"],
+  },
+  {
+    id: "image-design",
+    label: "图像设计",
+    keywords: ["画图", "生图", "海报", "设计", "修图", "抠图", "logo", "image"],
+    relatedQueries: ["AI绘画", "AI设计", "海报生成", "图像编辑"],
+    toolCategories: ["image", "utils"],
+    toolTags: ["ai-image", "ai-design", "image-editing", "creativity"],
+    tutorialCategories: ["AI绘画", "AI图像", "AI设计"],
+    tutorialKeywords: ["生图", "绘画", "修图", "设计", "提示词"],
+    boostToolIds: ["midjourney", "flux", "recraft", "ideogram", "remove-bg", "jm"],
+  },
+  {
+    id: "video-create",
+    label: "视频制作",
+    keywords: ["视频", "剪辑", "短视频", "分镜", "特效", "口播", "video"],
+    relatedQueries: ["AI视频", "视频剪辑", "分镜生成", "短片制作"],
+    toolCategories: ["video", "image"],
+    toolTags: ["ai-video", "video-editing", "video-generation"],
+    tutorialCategories: ["AI视频", "AI效率"],
+    tutorialKeywords: ["视频", "分镜", "剪辑", "短片"],
+    boostToolIds: ["runway", "kling-ai", "hailuo", "seko", "veo", "jm-video"],
+  },
+  {
+    id: "coding-dev",
+    label: "编程开发",
+    keywords: ["编程", "代码", "开发", "插件", "debug", "脚本", "coding"],
+    relatedQueries: ["AI编程", "代码生成", "开发助手", "编程小白"],
+    toolCategories: ["coding", "utils", "writing"],
+    toolTags: ["ai-code", "development", "productivity"],
+    tutorialCategories: ["AI编程", "AI大模型"],
+    tutorialKeywords: ["编程", "代码", "插件", "网页"],
+    boostToolIds: ["cursor", "trae", "windsurf", "chatgpt"],
+  },
+  {
+    id: "audio-podcast",
+    label: "音频播客",
+    keywords: ["配音", "语音", "播客", "音乐", "音频", "tts", "stt"],
+    relatedQueries: ["AI音频", "播客制作", "文本转语音", "音乐生成"],
+    toolCategories: ["audio", "utils"],
+    toolTags: ["ai-audio", "text-to-speech", "speech-to-text", "ai-podcast"],
+    tutorialCategories: ["AI音频", "AI播客"],
+    tutorialKeywords: ["音频", "配音", "播客", "音乐"],
+    boostToolIds: ["suno", "ttsmaker", "listenhub", "tongyi-tingwu"],
+  },
+  {
+    id: "agent-automation",
+    label: "智能体与自动化",
+    keywords: ["agent", "智能体", "自动执行", "工作流", "mcp", "automation"],
+    relatedQueries: ["AI智能体", "自动化流程", "无代码智能体", "Agent工具"],
+    toolCategories: ["utils", "writing", "office"],
+    toolTags: ["automation", "ai-assistant", "no-code"],
+    tutorialCategories: ["AI智能体", "AI通用智能体", "AI大模型"],
+    tutorialKeywords: ["智能体", "自动化", "工作流", "MCP"],
+    boostToolIds: ["coze", "tiangong", "hatch", "manus"],
+  },
+];
+
*** End Patch


### 2026-02-25T02:39:20.138Z call_HFnzqxtRPucXeQyd7YStGOvG
*** Begin Patch
*** Add File: src/lib/searchIntent.ts
+import toolsData from "@/data/tools.json";
+import { tutorials, Tutorial } from "@/data/tutorials";
+import { HOT_SEARCH_QUERIES, SEARCH_INTENT_RULES, SearchIntentRule } from "@/data/searchIntents";
+import { Tool } from "@/lib/types";
+
+export interface RankedToolRecommendation {
+  tool: Tool;
+  score: number;
+  reason: string;
+}
+
+export interface RankedTutorialRecommendation {
+  tutorial: Tutorial;
+  score: number;
+  reason: string;
+}
+
+export interface SearchIntentResult {
+  query: string;
+  normalizedQuery: string;
+  matchedIntentLabels: string[];
+  suggestedQueries: string[];
+  recommendedTools: RankedToolRecommendation[];
+  recommendedTutorials: RankedTutorialRecommendation[];
+}
+
+interface RecommendOptions {
+  maxTools?: number;
+  maxTutorials?: number;
+  maxSuggestions?: number;
+}
+
+const visibleTools: Tool[] = (toolsData.tools as Tool[]).filter((tool) => tool.isVisible !== false);
+
+const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, "");
+
+const includesKeyword = (text: string, keyword: string): boolean => {
+  const normalizedText = normalize(text);
+  const normalizedKeyword = normalize(keyword);
+  return Boolean(normalizedKeyword) && normalizedText.includes(normalizedKeyword);
+};
+
+const scoreKeywordMatch = (query: string, keyword: string): number => {
+  const q = normalize(query);
+  const k = normalize(keyword);
+  if (!q || !k) return 0;
+  if (q === k) return 20;
+  if (q.includes(k) || k.includes(q)) return 12;
+  return 0;
+};
+
+const collectMatchedIntents = (query: string): SearchIntentRule[] => {
+  if (!query.trim()) return [];
+
+  const scored = SEARCH_INTENT_RULES
+    .map((intent) => ({
+      intent,
+      score: Math.max(...intent.keywords.map((kw) => scoreKeywordMatch(query, kw)), 0),
+    }))
+    .filter((item) => item.score > 0)
+    .sort((a, b) => b.score - a.score);
+
+  return scored.map((item) => item.intent);
+};
+
+const buildSuggestions = (
+  query: string,
+  matchedIntents: SearchIntentRule[],
+  maxSuggestions: number
+): string[] => {
+  const normalizedQuery = normalize(query);
+  const intentQueries = matchedIntents.flatMap((intent) => intent.relatedQueries);
+  const base = normalizedQuery
+    ? [...intentQueries, ...HOT_SEARCH_QUERIES]
+    : HOT_SEARCH_QUERIES;
+
+  const unique: string[] = [];
+  for (const candidate of base) {
+    if (!candidate || unique.includes(candidate)) continue;
+    if (!normalizedQuery || includesKeyword(candidate, normalizedQuery) || includesKeyword(normalizedQuery, candidate)) {
+      unique.push(candidate);
+    }
+    if (unique.length >= maxSuggestions) break;
+  }
+
+  if (unique.length === 0) {
+    return HOT_SEARCH_QUERIES.slice(0, maxSuggestions);
+  }
+  return unique;
+};
+
+const rankTools = (
+  query: string,
+  matchedIntents: SearchIntentRule[],
+  maxTools: number
+): RankedToolRecommendation[] => {
+  const normalizedQuery = normalize(query);
+
+  const ranked = visibleTools
+    .map((tool) => {
+      let score = 0;
+      const reasons: string[] = [];
+      const tagSet = new Set(tool.tags || []);
+      const searchableText = `${tool.name} ${tool.description} ${(tool.tags || []).join(" ")}`;
+
+      for (const intent of matchedIntents) {
+        if (intent.boostToolIds?.includes(tool.id)) {
+          score += 30;
+          reasons.push(intent.label);
+        }
+        if (intent.toolCategories?.includes(tool.toolCategory || "utils")) {
+          score += 16;
+          reasons.push(`${intent.label}·分类匹配`);
+        }
+        if ((intent.toolTags || []).some((tag) => tagSet.has(tag))) {
+          score += 12;
+          reasons.push(`${intent.label}·标签匹配`);
+        }
+        if (intent.keywords.some((keyword) => includesKeyword(searchableText, keyword))) {
+          score += 8;
+        }
+      }
+
+      if (normalizedQuery) {
+        if (includesKeyword(tool.name, normalizedQuery)) score += 25;
+        if (includesKeyword(tool.description, normalizedQuery)) score += 15;
+        if ((tool.tags || []).some((tag) => includesKeyword(tag, normalizedQuery))) score += 14;
+      }
+
+      const reason = reasons.length > 0 ? reasons[0] : "关键词语义匹配";
+      return { tool, score, reason };
+    })
+    .filter((item) => item.score > 0)
+    .sort((a, b) => b.score - a.score || (a.tool.displayOrder || 9999) - (b.tool.displayOrder || 9999));
+
+  return ranked.slice(0, maxTools);
+};
+
+const rankTutorials = (
+  query: string,
+  matchedIntents: SearchIntentRule[],
+  maxTutorials: number
+): RankedTutorialRecommendation[] => {
+  const normalizedQuery = normalize(query);
+
+  const ranked = tutorials
+    .map((tutorial) => {
+      let score = 0;
+      const reasons: string[] = [];
+      const skills = tutorial.skillTags || [];
+      const searchableText = `${tutorial.title} ${tutorial.description} ${tutorial.category} ${skills.join(" ")}`;
+
+      for (const intent of matchedIntents) {
+        if (intent.boostTutorialIds?.includes(tutorial.id)) {
+          score += 28;
+          reasons.push(intent.label);
+        }
+        if (intent.tutorialCategories?.includes(tutorial.category)) {
+          score += 16;
+          reasons.push(`${intent.label}·教程分类匹配`);
+        }
+        if ((intent.tutorialKeywords || []).some((keyword) => includesKeyword(searchableText, keyword))) {
+          score += 12;
+        }
+      }
+
+      if (normalizedQuery) {
+        if (includesKeyword(tutorial.title, normalizedQuery)) score += 24;
+        if (includesKeyword(tutorial.description, normalizedQuery)) score += 14;
+        if (includesKeyword(tutorial.category, normalizedQuery)) score += 12;
+        if (skills.some((skill) => includesKeyword(skill, normalizedQuery))) score += 12;
+      }
+
+      const reason = reasons.length > 0 ? reasons[0] : "关键词语义匹配";
+      return { tutorial, score, reason };
+    })
+    .filter((item) => item.score > 0)
+    .sort((a, b) => b.score - a.score);
+
+  return ranked.slice(0, maxTutorials);
+};
+
+export function getSearchIntentRecommendations(
+  query: string,
+  options: RecommendOptions = {}
+): SearchIntentResult {
+  const maxTools = options.maxTools ?? 3;
+  const maxTutorials = options.maxTutorials ?? 3;
+  const maxSuggestions = options.maxSuggestions ?? 8;
+  const normalizedQuery = normalize(query);
+  const matchedIntents = collectMatchedIntents(query);
+
+  return {
+    query,
+    normalizedQuery,
+    matchedIntentLabels: matchedIntents.map((intent) => intent.label),
+    suggestedQueries: buildSuggestions(query, matchedIntents, maxSuggestions),
+    recommendedTools: rankTools(query, matchedIntents, maxTools),
+    recommendedTutorials: rankTutorials(query, matchedIntents, maxTutorials),
+  };
+}
+
*** End Patch


### 2026-02-25T02:39:46.652Z call_zGXYATMaMdAYh3ncTIhhLfMP
*** Begin Patch
*** Add File: src/components/SearchIntentPanel.tsx
+"use client";
+
+import Link from "@/i18n/Link";
+import { getSearchIntentRecommendations } from "@/lib/searchIntent";
+import { useMemo } from "react";
+
+interface SearchIntentPanelProps {
+  query: string;
+  onQuerySelect: (query: string) => void;
+  className?: string;
+  maxTools?: number;
+  maxTutorials?: number;
+}
+
+export default function SearchIntentPanel({
+  query,
+  onQuerySelect,
+  className = "",
+  maxTools = 3,
+  maxTutorials = 3,
+}: SearchIntentPanelProps) {
+  const result = useMemo(
+    () => getSearchIntentRecommendations(query, { maxTools, maxTutorials, maxSuggestions: 10 }),
+    [query, maxTools, maxTutorials]
+  );
+
+  const hasQuery = Boolean(result.normalizedQuery);
+
+  return (
+    <section className={`rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-4 ${className}`}>
+      <div className="flex items-center justify-between gap-3 mb-3">
+        <div>
+          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">猜你想搜</h3>
+          <p className="text-xs text-slate-500 dark:text-slate-400">基于关键词意图，联动推荐工具和教程</p>
+        </div>
+        {hasQuery && result.matchedIntentLabels.length > 0 && (
+          <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
+            命中: {result.matchedIntentLabels.slice(0, 2).join(" / ")}
+          </span>
+        )}
+      </div>
+
+      <div className="flex flex-wrap gap-2">
+        {result.suggestedQueries.map((keyword) => (
+          <button
+            key={keyword}
+            type="button"
+            onClick={() => onQuerySelect(keyword)}
+            className="text-sm px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-primary-50 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 transition-colors"
+          >
+            {keyword}
+          </button>
+        ))}
+      </div>
+
+      {hasQuery && (
+        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
+          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
+            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">工具推荐</h4>
+            {result.recommendedTools.length === 0 ? (
+              <p className="text-xs text-slate-500 dark:text-slate-400">暂无强匹配工具，可尝试上方热门关键词。</p>
+            ) : (
+              <ul className="space-y-2">
+                {result.recommendedTools.map(({ tool, reason }) => (
+                  <li key={tool.id}>
+                    <Link
+                      href={`/tools/${tool.id}`}
+                      className="block rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
+                    >
+                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{tool.name}</p>
+                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{reason}</p>
+                    </Link>
+                  </li>
+                ))}
+              </ul>
+            )}
+          </div>
+
+          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
+            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">教程推荐</h4>
+            {result.recommendedTutorials.length === 0 ? (
+              <p className="text-xs text-slate-500 dark:text-slate-400">暂无强匹配教程，可尝试上方热门关键词。</p>
+            ) : (
+              <ul className="space-y-2">
+                {result.recommendedTutorials.map(({ tutorial, reason }) => (
+                  <li key={tutorial.id}>
+                    <a
+                      href={tutorial.url}
+                      target="_blank"
+                      rel="noopener noreferrer"
+                      className="block rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
+                    >
+                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{tutorial.title}</p>
+                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
+                        {tutorial.category} · {reason}
+                      </p>
+                    </a>
+                  </li>
+                ))}
+              </ul>
+            )}
+          </div>
+        </div>
+      )}
+    </section>
+  );
+}
+
*** End Patch


### 2026-02-25T02:40:04.878Z call_bnX5jQbu7XamydoL1clvFU4A
*** Begin Patch
*** Update File: src/components/HomeContent.tsx
@@
 import StatsDisplay from './StatsDisplay'; // 统计显示组件
 import { HotSection } from '@/components/hot'; // 热门推荐区域组件
 import BenefitsSection from './BenefitsSection'; // 崭新羊毛区域组件
+import SearchIntentPanel from './SearchIntentPanel'; // 搜索意图推荐组件
 import { trackUserAction, trackPageView, setTag } from '@/utils/clarity'; // 埋点分析工具
 import useDebounce from '@/hooks/useDebounce'; // 防抖Hook
 import useHotkey from '@/hooks/useHotkey'; // 快捷键Hook
@@
   const handleSearchSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (searchQuery.trim()) {
@@
       router.push(`/unified-search?q=${encodeURIComponent(searchQuery.trim())}`);
     }
   };
+
+  // 点击热门关键词/意图推荐项
+  const handleIntentQuerySelect = (query: string) => {
+    const trimmed = query.trim();
+    if (!trimmed) return;
+    setSearchQuery(trimmed);
+    trackUserAction('search_intent_click', {
+      query: trimmed,
+      search_source: 'home_intent_panel'
+    });
+    router.push(`/unified-search?q=${encodeURIComponent(trimmed)}`);
+  };
@@
               <input
                 ref={searchInputRef}
                 type="text"
                 id="search"
@@
                 autoComplete="off"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
+                onFocus={() => {
+                  trackUserAction('search_focus', {
+                    search_source: 'home_page'
+                  });
+                }}
               />
@@
             </form>
             {/* 搜索提示已移除 */}
           </div>
+
+          {/* 搜索意图推荐：热门关键词 + 工具/教程联动推荐 */}
+          <div className="mb-10 max-w-4xl mx-auto">
+            <SearchIntentPanel
+              query={searchQuery}
+              onQuerySelect={handleIntentQuerySelect}
+            />
+          </div>
           
           {/* 添加工具和教程统计数据 */}
           <div className="mb-12 max-w-4xl mx-auto">
*** End Patch


### 2026-02-25T02:40:18.791Z call_SgSAYT1XtWTxuTyYEV0uu7wV
*** Begin Patch
*** Update File: src/components/UnifiedSearchContent.tsx
@@
 import { tutorials, Tutorial } from '@/data/tutorials'; // 教程数据和类型
 import TutorialCard from '@/components/TutorialCard'; // 教程卡片组件
 import ToolSortControls, { SortMethod } from './ToolSortControls'; // 排序控制组件
 import { applySorting, getVisibleTools } from '@/utils/sortTools'; // 排序和过滤工具函数
 import useHotkey from '@/hooks/useHotkey'; // 快捷键Hook
+import SearchIntentPanel from '@/components/SearchIntentPanel'; // 搜索意图推荐
+import { trackUserAction } from '@/utils/clarity'; // 搜索行为埋点
@@
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault(); // 阻止表单默认提交行为
     if (inputValue.trim()) { // 如果输入内容不为空
+      trackUserAction('search', {
+        query: inputValue.trim(),
+        search_source: 'unified_search'
+      });
       // 更新URL参数，跳转到统一搜索页面
       router.push(`/unified-search?q=${encodeURIComponent(inputValue.trim())}`);
     }
   };
+
+  // 点击热门关键词/意图推荐项
+  const handleIntentQuerySelect = (query: string) => {
+    const trimmed = query.trim();
+    if (!trimmed) return;
+    setInputValue(trimmed);
+    trackUserAction('search_intent_click', {
+      query: trimmed,
+      search_source: 'unified_search_panel'
+    });
+    router.push(`/unified-search?q=${encodeURIComponent(trimmed)}`);
+  };
@@
                 autoComplete="off"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
+                onFocus={() => {
+                  trackUserAction('search_focus', {
+                    search_source: 'unified_search'
+                  });
+                }}
               />
@@
             </form>
             {/* 搜索提示已移除 */}
           </div>
+
+          <div className="mb-10 max-w-4xl mx-auto">
+            <SearchIntentPanel
+              query={inputValue}
+              onQuerySelect={handleIntentQuerySelect}
+              maxTools={4}
+              maxTutorials={4}
+            />
+          </div>
           
           {/* 加载状态 */}
*** End Patch


### 2026-02-25T03:41:38.719Z call_JOuzkhml9lmQkSJZEvGPsyz9
*** Begin Patch
*** Add File: src/data/toolOneLiners.ts
+export const TOOL_ONE_LINERS: Record<string, string> = {
+  veo: "全球领先的视频生成工具，长镜头质量和稳定性都很强。",
+  "jm-video": "Seedance 2.0 加持的爆款视频工具，速度快、成片质感高。",
+  jm: "创意表达非常灵活，做海报、风格图和视觉提案都很顺手。",
+  runway: "视频创作者常用的一站式平台，覆盖生成、编辑和风格化流程。",
+  hailuo: "中文语境友好的视频工具，上手快，适合日常短视频创作。",
+  chatgpt: "通用能力最全面的 AI 助手，写作、分析和问答都稳定。",
+  deepseek: "中文任务表现强，性价比高，适合高频工作场景。",
+  claude: "长文本理解和输出体验优秀，适合深度写作与整理。",
+  cursor: "AI 原生代码编辑体验成熟，适合快速开发和重构。",
+  coze: "零代码搭建智能体效率高，适合快速验证业务想法。",
+};
+
*** End Patch


### 2026-02-25T03:41:56.207Z call_Zw7ScfPN8rY8CfQv4dPer0Rb
*** Begin Patch
*** Update File: src/lib/searchIntent.ts
@@
 import toolsData from "@/data/tools.json";
 import { tutorials, Tutorial } from "@/data/tutorials";
 import { HOT_SEARCH_QUERIES, SEARCH_INTENT_RULES, SearchIntentRule } from "@/data/searchIntents";
+import { TOOL_ONE_LINERS } from "@/data/toolOneLiners";
 import { Tool } from "@/lib/types";
@@
 export interface RankedToolRecommendation {
   tool: Tool;
   score: number;
   reason: string;
+  comment: string;
 }
@@
 const visibleTools: Tool[] = (toolsData.tools as Tool[]).filter((tool) => tool.isVisible !== false);
@@
 const scoreKeywordMatch = (query: string, keyword: string): number => {
@@
 };
+
+const getCategoryFallbackComment = (tool: Tool): string => {
+  switch (tool.toolCategory) {
+    case "writing":
+      return "对话和写作兼顾，适合内容创作与日常提效。";
+    case "image":
+      return "出图效率和质量平衡，适合设计与视觉表达。";
+    case "video":
+      return "覆盖生成到剪辑流程，适合短视频和创意内容制作。";
+    case "audio":
+      return "从配音到音频生成都能处理，适合内容配声和播客场景。";
+    case "office":
+      return "聚焦办公协作和文档产出，适合高频工作任务。";
+    case "coding":
+      return "面向开发者的智能助手，能明显提升编码和调试效率。";
+    case "utils":
+    default:
+      return "轻量实用的效率工具，适合快速完成高频任务。";
+  }
+};
+
+const getToolComment = (tool: Tool): string => {
+  const custom = TOOL_ONE_LINERS[tool.id];
+  if (custom) return custom;
+  return getCategoryFallbackComment(tool);
+};
@@
-      return { tool, score, reason };
+      return { tool, score, reason, comment: getToolComment(tool) };
     })
*** End Patch


### 2026-02-25T03:42:10.121Z call_egcrTg0I28coY4idL1yK8QQb
*** Begin Patch
*** Update File: src/components/SearchIntentPanel.tsx
@@
-                {result.recommendedTools.map(({ tool, reason }) => (
+                {result.recommendedTools.map(({ tool, reason, comment }) => (
                   <li key={tool.id}>
                     <Link
                       href={`/tools/${tool.id}`}
                       className="block rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                     >
                       <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{tool.name}</p>
-                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{reason}</p>
+                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{comment}</p>
+                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">命中逻辑: {reason}</p>
                     </Link>
                   </li>
                 ))}
*** End Patch


### 2026-02-25T05:57:53.758Z call_hxkRwLsr8aJCUSG0lpZnC0fb
*** Begin Patch
*** Update File: src/data/searchIntents.ts
@@
 export interface SearchIntentRule {
@@
   boostTutorialIds?: string[];
 }
+
+export interface QueryAliasRule {
+  trigger: string;
+  expansions: string[];
+  intentIds?: string[];
+}
@@
 export const SEARCH_INTENT_RULES: SearchIntentRule[] = [
@@
   },
 ];
+
+// 口语化搜索别名：将用户自然表达映射到可识别的意图关键词
+export const QUERY_ALIAS_RULES: QueryAliasRule[] = [
+  {
+    trigger: "做短剧",
+    expansions: ["视频", "短视频", "分镜", "剧情", "剪辑"],
+    intentIds: ["video-create"],
+  },
+  {
+    trigger: "短剧",
+    expansions: ["视频", "短视频", "分镜"],
+    intentIds: ["video-create"],
+  },
+  {
+    trigger: "写东西",
+    expansions: ["写作", "文案", "文章", "总结"],
+    intentIds: ["writing-copy"],
+  },
+  {
+    trigger: "写文章",
+    expansions: ["写作", "文案", "文章"],
+    intentIds: ["writing-copy"],
+  },
+  {
+    trigger: "做视频",
+    expansions: ["视频", "短视频", "剪辑"],
+    intentIds: ["video-create"],
+  },
+  {
+    trigger: "做图",
+    expansions: ["画图", "生图", "设计", "海报"],
+    intentIds: ["image-design"],
+  },
+  {
+    trigger: "写代码",
+    expansions: ["编程", "代码", "开发"],
+    intentIds: ["coding-dev"],
+  },
+  {
+    trigger: "做播客",
+    expansions: ["播客", "音频", "配音"],
+    intentIds: ["audio-podcast"],
+  },
+  {
+    trigger: "做智能体",
+    expansions: ["智能体", "agent", "自动化"],
+    intentIds: ["agent-automation"],
+  },
+];
*** End Patch


### 2026-02-25T05:58:31.306Z call_lDrV5AYUqZy4ZgvMx9CrnVPa
*** Begin Patch
*** Update File: src/lib/searchIntent.ts
@@
 import toolsData from "@/data/tools.json";
 import { tutorials, Tutorial } from "@/data/tutorials";
-import { HOT_SEARCH_QUERIES, SEARCH_INTENT_RULES, SearchIntentRule } from "@/data/searchIntents";
+import {
+  HOT_SEARCH_QUERIES,
+  QUERY_ALIAS_RULES,
+  SEARCH_INTENT_RULES,
+  SearchIntentRule,
+} from "@/data/searchIntents";
 import { TOOL_ONE_LINERS } from "@/data/toolOneLiners";
 import { Tool } from "@/lib/types";
@@
 interface RecommendOptions {
   maxTools?: number;
   maxTutorials?: number;
   maxSuggestions?: number;
 }
+
+interface ExpandedQueryInfo {
+  terms: string[];
+  boostedIntentIds: Set<string>;
+}
@@
 const scoreKeywordMatch = (query: string, keyword: string): number => {
   const q = normalize(query);
   const k = normalize(keyword);
   if (!q || !k) return 0;
   if (q === k) return 20;
   if (q.includes(k) || k.includes(q)) return 12;
   return 0;
 };
+
+const expandQueryInfo = (query: string): ExpandedQueryInfo => {
+  const trimmed = query.trim();
+  const terms = new Set<string>();
+  const boostedIntentIds = new Set<string>();
+
+  if (trimmed) {
+    terms.add(trimmed);
+    for (const token of trimmed.split(/[\s,，。;；|/]+/).filter(Boolean)) {
+      terms.add(token);
+    }
+  }
+
+  for (const alias of QUERY_ALIAS_RULES) {
+    if (!trimmed) continue;
+    if (includesKeyword(trimmed, alias.trigger)) {
+      alias.expansions.forEach((item) => terms.add(item));
+      (alias.intentIds || []).forEach((id) => boostedIntentIds.add(id));
+    }
+  }
+
+  return {
+    terms: Array.from(terms),
+    boostedIntentIds,
+  };
+};
@@
-const collectMatchedIntents = (query: string): SearchIntentRule[] => {
-  if (!query.trim()) return [];
+const collectMatchedIntents = (queryTerms: string[], boostedIntentIds: Set<string>): SearchIntentRule[] => {
+  if (queryTerms.length === 0) return [];
 
   const scored = SEARCH_INTENT_RULES
     .map((intent) => ({
       intent,
-      score: Math.max(...intent.keywords.map((kw) => scoreKeywordMatch(query, kw)), 0),
+      score: (() => {
+        const allScores = queryTerms.flatMap((term) =>
+          intent.keywords.map((kw) => scoreKeywordMatch(term, kw))
+        );
+        const matchedScores = allScores.filter((s) => s > 0);
+        const base = matchedScores.length > 0 ? Math.max(...matchedScores) : 0;
+        const multiHitBonus = Math.min(Math.max(matchedScores.length - 1, 0), 3) * 4;
+        const aliasBoost = boostedIntentIds.has(intent.id) ? 20 : 0;
+        return base + multiHitBonus + aliasBoost;
+      })(),
     }))
     .filter((item) => item.score > 0)
     .sort((a, b) => b.score - a.score);
@@
 const rankTools = (
-  query: string,
+  queryTerms: string[],
   matchedIntents: SearchIntentRule[],
   maxTools: number
 ): RankedToolRecommendation[] => {
-  const normalizedQuery = normalize(query);
-
   const ranked = visibleTools
     .map((tool) => {
       let score = 0;
@@
-      if (normalizedQuery) {
-        if (includesKeyword(tool.name, normalizedQuery)) score += 25;
-        if (includesKeyword(tool.description, normalizedQuery)) score += 15;
-        if ((tool.tags || []).some((tag) => includesKeyword(tag, normalizedQuery))) score += 14;
+      if (queryTerms.length > 0) {
+        const nameMatch = queryTerms.some((term) => includesKeyword(tool.name, term));
+        const descMatch = queryTerms.some((term) => includesKeyword(tool.description, term));
+        const tagMatch = queryTerms.some((term) =>
+          (tool.tags || []).some((tag) => includesKeyword(tag, term))
+        );
+        if (nameMatch) score += 25;
+        if (descMatch) score += 15;
+        if (tagMatch) score += 14;
       }
@@
 const rankTutorials = (
-  query: string,
+  queryTerms: string[],
   matchedIntents: SearchIntentRule[],
   maxTutorials: number
 ): RankedTutorialRecommendation[] => {
-  const normalizedQuery = normalize(query);
-
   const ranked = tutorials
     .map((tutorial) => {
@@
-      if (normalizedQuery) {
-        if (includesKeyword(tutorial.title, normalizedQuery)) score += 24;
-        if (includesKeyword(tutorial.description, normalizedQuery)) score += 14;
-        if (includesKeyword(tutorial.category, normalizedQuery)) score += 12;
-        if (skills.some((skill) => includesKeyword(skill, normalizedQuery))) score += 12;
+      if (queryTerms.length > 0) {
+        const titleMatch = queryTerms.some((term) => includesKeyword(tutorial.title, term));
+        const descMatch = queryTerms.some((term) => includesKeyword(tutorial.description, term));
+        const categoryMatch = queryTerms.some((term) => includesKeyword(tutorial.category, term));
+        const skillMatch = queryTerms.some((term) =>
+          skills.some((skill) => includesKeyword(skill, term))
+        );
+        if (titleMatch) score += 24;
+        if (descMatch) score += 14;
+        if (categoryMatch) score += 12;
+        if (skillMatch) score += 12;
       }
@@
 export function getSearchIntentRecommendations(
   query: string,
   options: RecommendOptions = {}
 ): SearchIntentResult {
@@
   const maxTools = options.maxTools ?? 3;
   const maxTutorials = options.maxTutorials ?? 3;
   const maxSuggestions = options.maxSuggestions ?? 8;
   const normalizedQuery = normalize(query);
-  const matchedIntents = collectMatchedIntents(query);
+  const expandedQueryInfo = expandQueryInfo(query);
+  const matchedIntents = collectMatchedIntents(
+    expandedQueryInfo.terms,
+    expandedQueryInfo.boostedIntentIds
+  );
 
   return {
     query,
     normalizedQuery,
     matchedIntentLabels: matchedIntents.map((intent) => intent.label),
     suggestedQueries: buildSuggestions(query, matchedIntents, maxSuggestions),
-    recommendedTools: rankTools(query, matchedIntents, maxTools),
-    recommendedTutorials: rankTutorials(query, matchedIntents, maxTutorials),
+    recommendedTools: rankTools(expandedQueryInfo.terms, matchedIntents, maxTools),
+    recommendedTutorials: rankTutorials(expandedQueryInfo.terms, matchedIntents, maxTutorials),
   };
 }
*** End Patch


