import toolsData from "@/data/tools.json";
import { tutorials, Tutorial } from "@/data/tutorials";
import {
  HOT_SEARCH_QUERIES,
  QUERY_ALIAS_RULES,
  SEARCH_INTENT_RULES,
  SearchIntentRule,
} from "@/data/searchIntents";
import { TOOL_ONE_LINERS } from "@/data/toolOneLiners";
import { Tool } from "@/lib/types";

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
}

interface ExpandedQueryInfo {
  terms: string[];
  boostedIntentIds: Set<string>;
}

const visibleTools: Tool[] = (toolsData.tools as Tool[]).filter((tool) => tool.isVisible !== false);

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, "");

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

const getCategoryFallbackComment = (tool: Tool): string => {
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

const getToolComment = (tool: Tool): string => {
  const custom = TOOL_ONE_LINERS[tool.id];
  if (custom) return custom;
  return getCategoryFallbackComment(tool);
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
  maxSuggestions: number
): string[] => {
  const normalizedQuery = normalize(query);
  const intentQueries = matchedIntents.flatMap((intent) => intent.relatedQueries);
  const base = normalizedQuery ? [...intentQueries, ...HOT_SEARCH_QUERIES] : HOT_SEARCH_QUERIES;

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
    return HOT_SEARCH_QUERIES.slice(0, maxSuggestions);
  }
  return unique;
};

const rankTools = (
  queryTerms: string[],
  matchedIntents: SearchIntentRule[],
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
          reasons.push(`${intent.label}·分类匹配`);
        }
        if ((intent.toolTags || []).some((tag) => tagSet.has(tag))) {
          score += 12;
          reasons.push(`${intent.label}·标签匹配`);
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

      const reason = reasons.length > 0 ? reasons[0] : "关键词语义匹配";
      return { tool, score, reason, comment: getToolComment(tool) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.tool.displayOrder || 9999) - (b.tool.displayOrder || 9999));

  return ranked.slice(0, maxTools);
};

const rankTutorials = (
  queryTerms: string[],
  matchedIntents: SearchIntentRule[],
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
          reasons.push(`${intent.label}·教程分类匹配`);
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

      const reason = reasons.length > 0 ? reasons[0] : "关键词语义匹配";
      return { tutorial, score, reason };
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
  const normalizedQuery = normalize(query);
  const expandedQueryInfo = expandQueryInfo(query);
  const matchedIntents = collectMatchedIntents(
    expandedQueryInfo.terms,
    expandedQueryInfo.boostedIntentIds
  );

  return {
    query,
    normalizedQuery,
    matchedIntentLabels: matchedIntents.map((intent) => intent.label),
    suggestedQueries: buildSuggestions(query, matchedIntents, maxSuggestions),
    recommendedTools: rankTools(expandedQueryInfo.terms, matchedIntents, maxTools),
    recommendedTutorials: rankTutorials(expandedQueryInfo.terms, matchedIntents, maxTutorials),
  };
}
