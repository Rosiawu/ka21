import toolsData from "@/data/tools.json";
import { tutorials, Tutorial } from "@/data/tutorials";
import {
  HOT_SEARCH_QUERIES,
  QUERY_ALIAS_RULES,
  SEARCH_INTENT_RULES,
  SearchIntentRule,
} from "@/data/searchIntents";
import { TOOL_ONE_LINERS, TOOL_ONE_LINERS_EN } from "@/data/toolOneLiners";
import { Tool } from "@/lib/types";
import { localizeTool } from "@/lib/toolLocale";

export interface RankedToolRecommendation {
  tool: Tool;
  score: number;
  reason: string;
  comment: string;
}

export interface RankedTutorialRecommendation {
  tutorial: Tutorial;
  score: number;
  reason: string;
}

export interface SearchIntentResult {
  query: string;
  normalizedQuery: string;
  matchedIntentLabels: string[];
  suggestedQueries: string[];
  recommendedTools: RankedToolRecommendation[];
  recommendedTutorials: RankedTutorialRecommendation[];
}

interface RecommendOptions {
  maxTools?: number;
  maxTutorials?: number;
  maxSuggestions?: number;
  locale?: "zh" | "en";
}

interface ExpandedQueryInfo {
  terms: string[];
  boostedIntentIds: Set<string>;
}

const visibleTools: Tool[] = (toolsData.tools as Tool[]).filter((tool) => tool.isVisible !== false);

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, "");

const HOT_SEARCH_QUERIES_EN: string[] = [
  "DeepSeek",
  "ChatGPT",
  "Claude",
  "AI image generation",
  "AI video generation",
  "PPT",
  "Feishu Bitable",
  "AI coding",
  "AI agents",
  "Productivity tools",
];

const INTENT_LABEL_EN: Record<string, string> = {
  "office-efficiency": "Office Productivity",
  "ppt-doc": "PPT & Docs",
  "writing-copy": "Writing & Copywriting",
  "image-design": "Image & Design",
  "video-create": "Video Creation",
  "coding-dev": "Coding & Development",
  "audio-podcast": "Audio & Podcast",
  "agent-automation": "Agents & Automation",
};

const INTENT_RELATED_QUERIES_EN: Record<string, string[]> = {
  "office-efficiency": ["Productivity tools", "Feishu Bitable", "Automation workflow", "Office AI"],
  "ppt-doc": ["PPT", "AI slides", "Presentation generation", "Document generation"],
  "writing-copy": ["AI writing", "Copy generation", "Newsletter formatting", "Content summary"],
  "image-design": ["AI image generation", "AI design", "Poster generation", "Image editing"],
  "video-create": ["AI video generation", "Video editing", "Storyboard generation", "Short film creation"],
  "coding-dev": ["AI coding", "Code generation", "Dev assistant", "Beginner coding AI"],
  "audio-podcast": ["AI audio", "Podcast creation", "Text to speech", "Music generation"],
  "agent-automation": ["AI agents", "Automation workflows", "No-code agents", "Agent tools"],
};

const TUTORIAL_CATEGORY_LABEL_EN: Record<string, string> = {
  "AI效率": "AI Productivity",
  "AI图像": "AI Imaging",
  "AI视频": "AI Video",
  "AI编程": "AI Coding",
  "AI音频": "AI Audio",
  "AI智能体": "AI Agents",
  "AI大模型": "AI LLMs",
  "飞书多维表格": "Feishu Bitable",
  "AI绘画": "AI Drawing",
  "AI设计": "AI Design",
  "AI播客": "AI Podcast",
  "AI通用智能体": "General AI Agents",
  "AI办公": "AI Office",
};

const includesKeyword = (text: string, keyword: string): boolean => {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);
  return Boolean(normalizedKeyword) && normalizedText.includes(normalizedKeyword);
};

const scoreKeywordMatch = (query: string, keyword: string): number => {
  const q = normalize(query);
  const k = normalize(keyword);
  if (!q || !k) return 0;
  if (q === k) return 20;
  if (q.includes(k) || k.includes(q)) return 12;
  return 0;
};

const getCategoryFallbackComment = (tool: Tool, locale: "zh" | "en"): string => {
  if (locale === "en") {
    switch (tool.toolCategory) {
      case "writing":
        return "Great for both chat and writing, ideal for content creation and daily productivity.";
      case "image":
        return "Balances image quality and speed, ideal for design and visual expression.";
      case "video":
        return "Covers creation through editing for short-form and creative video workflows.";
      case "audio":
        return "Useful for voiceover and audio generation in podcast and content scenarios.";
      case "office":
        return "Focused on office collaboration and document output for frequent work tasks.";
      case "coding":
        return "A developer-focused assistant that boosts coding and debugging efficiency.";
      case "utils":
      default:
        return "Lightweight, practical utility tools for high-frequency tasks.";
    }
  }

  switch (tool.toolCategory) {
    case "writing":
      return "对话和写作兼顾，适合内容创作与日常提效。";
    case "image":
      return "出图效率和质量平衡，适合设计与视觉表达。";
    case "video":
      return "覆盖生成到剪辑流程，适合短视频和创意内容制作。";
    case "audio":
      return "从配音到音频生成都能处理，适合内容配声和播客场景。";
    case "office":
      return "聚焦办公协作和文档产出，适合高频工作任务。";
    case "coding":
      return "面向开发者的智能助手，能明显提升编码和调试效率。";
    case "utils":
    default:
      return "轻量实用的效率工具，适合快速完成高频任务。";
  }
};

const getToolComment = (tool: Tool, locale: "zh" | "en"): string => {
  const custom = locale === "en" ? TOOL_ONE_LINERS_EN[tool.id] : TOOL_ONE_LINERS[tool.id];
  if (custom) return custom;
  return getCategoryFallbackComment(tool, locale);
};

const getIntentLabel = (intent: SearchIntentRule, locale: "zh" | "en"): string => {
  if (locale === "en") {
    return INTENT_LABEL_EN[intent.id] || intent.label;
  }
  return intent.label;
};

const getRelatedQueries = (intent: SearchIntentRule, locale: "zh" | "en"): string[] => {
  if (locale === "en") {
    return INTENT_RELATED_QUERIES_EN[intent.id] || intent.relatedQueries;
  }
  return intent.relatedQueries;
};

const getHotQueries = (locale: "zh" | "en"): string[] => {
  return locale === "en" ? HOT_SEARCH_QUERIES_EN : HOT_SEARCH_QUERIES;
};

const getReasonSegment = (
  intent: SearchIntentRule,
  type: "category" | "tag" | "tutorialCategory",
  locale: "zh" | "en"
): string => {
  const label = getIntentLabel(intent, locale);
  if (locale === "en") {
    if (type === "category") return `${label} · Category Match`;
    if (type === "tag") return `${label} · Tag Match`;
    return `${label} · Tutorial Category Match`;
  }
  if (type === "category") return `${label}·分类匹配`;
  if (type === "tag") return `${label}·标签匹配`;
  return `${label}·教程分类匹配`;
};

const getSemanticReason = (locale: "zh" | "en"): string => {
  return locale === "en" ? "Keyword Semantic Match" : "关键词语义匹配";
};

const localizeTutorialCategory = (category: string, locale: "zh" | "en"): string => {
  if (locale !== "en") return category;
  return TUTORIAL_CATEGORY_LABEL_EN[category] || category;
};

const expandQueryInfo = (query: string): ExpandedQueryInfo => {
  const trimmed = query.trim();
  const terms = new Set<string>();
  const boostedIntentIds = new Set<string>();

  if (trimmed) {
    terms.add(trimmed);
    for (const token of trimmed.split(/[\s,，。;；|/]+/).filter(Boolean)) {
      terms.add(token);
    }
  }

  for (const alias of QUERY_ALIAS_RULES) {
    if (!trimmed) continue;
    if (includesKeyword(trimmed, alias.trigger)) {
      alias.expansions.forEach((item) => terms.add(item));
      (alias.intentIds || []).forEach((id) => boostedIntentIds.add(id));
    }
  }

  return {
    terms: Array.from(terms),
    boostedIntentIds,
  };
};

const collectMatchedIntents = (
  queryTerms: string[],
  boostedIntentIds: Set<string>
): SearchIntentRule[] => {
  if (queryTerms.length === 0) return [];

  const scored = SEARCH_INTENT_RULES
    .map((intent) => ({
      intent,
      score: (() => {
        const allScores = queryTerms.flatMap((term) =>
          intent.keywords.map((kw) => scoreKeywordMatch(term, kw))
        );
        const matchedScores = allScores.filter((s) => s > 0);
        const base = matchedScores.length > 0 ? Math.max(...matchedScores) : 0;
        const multiHitBonus = Math.min(Math.max(matchedScores.length - 1, 0), 3) * 4;
        const aliasBoost = boostedIntentIds.has(intent.id) ? 20 : 0;
        return base + multiHitBonus + aliasBoost;
      })(),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.intent);
};

const buildSuggestions = (
  query: string,
  matchedIntents: SearchIntentRule[],
  locale: "zh" | "en",
  maxSuggestions: number
): string[] => {
  const normalizedQuery = normalize(query);
  const intentQueries = matchedIntents.flatMap((intent) => getRelatedQueries(intent, locale));
  const hotQueries = getHotQueries(locale);
  const base = normalizedQuery ? [...intentQueries, ...hotQueries] : hotQueries;

  const unique: string[] = [];
  for (const candidate of base) {
    if (!candidate || unique.includes(candidate)) continue;
    if (
      !normalizedQuery ||
      includesKeyword(candidate, normalizedQuery) ||
      includesKeyword(normalizedQuery, candidate)
    ) {
      unique.push(candidate);
    }
    if (unique.length >= maxSuggestions) break;
  }

  if (unique.length === 0) {
    return hotQueries.slice(0, maxSuggestions);
  }
  return unique;
};

const rankTools = (
  queryTerms: string[],
  matchedIntents: SearchIntentRule[],
  locale: "zh" | "en",
  maxTools: number
): RankedToolRecommendation[] => {
  const ranked = visibleTools
    .map((tool) => {
      let score = 0;
      const reasons: string[] = [];
      const tagSet = new Set(tool.tags || []);
      const searchableText = `${tool.name} ${tool.description} ${(tool.tags || []).join(" ")}`;

      for (const intent of matchedIntents) {
        if (intent.boostToolIds?.includes(tool.id)) {
          score += 30;
          reasons.push(intent.label);
        }
        if (intent.toolCategories?.includes(tool.toolCategory || "utils")) {
          score += 16;
          reasons.push(getReasonSegment(intent, "category", locale));
        }
        if ((intent.toolTags || []).some((tag) => tagSet.has(tag))) {
          score += 12;
          reasons.push(getReasonSegment(intent, "tag", locale));
        }
        if (intent.keywords.some((keyword) => includesKeyword(searchableText, keyword))) {
          score += 8;
        }
      }

      if (queryTerms.length > 0) {
        const nameMatch = queryTerms.some((term) => includesKeyword(tool.name, term));
        const descMatch = queryTerms.some((term) => includesKeyword(tool.description, term));
        const tagMatch = queryTerms.some((term) =>
          (tool.tags || []).some((tag) => includesKeyword(tag, term))
        );
        if (nameMatch) score += 25;
        if (descMatch) score += 15;
        if (tagMatch) score += 14;
      }

      const reason = reasons.length > 0 ? reasons[0] : getSemanticReason(locale);
      return { tool: localizeTool(tool, locale), score, reason, comment: getToolComment(tool, locale) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.tool.displayOrder || 9999) - (b.tool.displayOrder || 9999));

  return ranked.slice(0, maxTools);
};

const rankTutorials = (
  queryTerms: string[],
  matchedIntents: SearchIntentRule[],
  locale: "zh" | "en",
  maxTutorials: number
): RankedTutorialRecommendation[] => {
  const ranked = tutorials
    .map((tutorial) => {
      let score = 0;
      const reasons: string[] = [];
      const skills = tutorial.skillTags || [];
      const searchableText = `${tutorial.title} ${tutorial.description} ${tutorial.category} ${skills.join(
        " "
      )}`;

      for (const intent of matchedIntents) {
        if (intent.boostTutorialIds?.includes(tutorial.id)) {
          score += 28;
          reasons.push(intent.label);
        }
        if (intent.tutorialCategories?.includes(tutorial.category)) {
          score += 16;
          reasons.push(getReasonSegment(intent, "tutorialCategory", locale));
        }
        if ((intent.tutorialKeywords || []).some((keyword) => includesKeyword(searchableText, keyword))) {
          score += 12;
        }
      }

      if (queryTerms.length > 0) {
        const titleMatch = queryTerms.some((term) => includesKeyword(tutorial.title, term));
        const descMatch = queryTerms.some((term) => includesKeyword(tutorial.description, term));
        const categoryMatch = queryTerms.some((term) => includesKeyword(tutorial.category, term));
        const skillMatch = queryTerms.some((term) => skills.some((skill) => includesKeyword(skill, term)));
        if (titleMatch) score += 24;
        if (descMatch) score += 14;
        if (categoryMatch) score += 12;
        if (skillMatch) score += 12;
      }

      const reason = reasons.length > 0 ? reasons[0] : getSemanticReason(locale);
      return { tutorial: { ...tutorial, category: localizeTutorialCategory(tutorial.category, locale) }, score, reason };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, maxTutorials);
};

export function getSearchIntentRecommendations(
  query: string,
  options: RecommendOptions = {}
): SearchIntentResult {
  const maxTools = options.maxTools ?? 3;
  const maxTutorials = options.maxTutorials ?? 3;
  const maxSuggestions = options.maxSuggestions ?? 8;
  const locale = options.locale === "en" ? "en" : "zh";
  const normalizedQuery = normalize(query);
  const expandedQueryInfo = expandQueryInfo(query);
  const matchedIntents = collectMatchedIntents(
    expandedQueryInfo.terms,
    expandedQueryInfo.boostedIntentIds
  );

  return {
    query,
    normalizedQuery,
    matchedIntentLabels: matchedIntents.map((intent) => getIntentLabel(intent, locale)),
    suggestedQueries: buildSuggestions(query, matchedIntents, locale, maxSuggestions),
    recommendedTools: rankTools(expandedQueryInfo.terms, matchedIntents, locale, maxTools),
    recommendedTutorials: rankTutorials(expandedQueryInfo.terms, matchedIntents, locale, maxTutorials),
  };
}
