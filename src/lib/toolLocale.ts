import { Tool } from "@/lib/types";
import { getCoreScenarioLabel, resolveToolCoreScenarios } from "@/lib/coreTaxonomy";

type ToolLocale = "zh" | "en";

const zhCharRegex = /[\u4e00-\u9fff]/;

const TOOL_NAME_EN: Record<string, string> = {
  doubao: "Doubao",
  freedraw: "Free Canvas",
  jm: "Jimeng",
  "jm-video": "Jimeng Video",
  "kling-ai": "Kling",
  "tongyi-efficiency": "Tongyi Efficiency",
  "feishu-base": "Feishu Bitable",
  getbiji: "Get Notes",
  tiangong: "Tiangong",
  hailuo: "Hailuo AI",
  maoandstar: "Cat & Star",
  chatglm: "Qingying",
  volcengine: "Volcano Engine",
  haimian: "Haimian Music",
  "minimax-audio": "Hailuo (MiniMax Audio)",
  heartlight: "HeartLight AI",
  "tongyi-tingwu": "Tongyi Tingwu",
  metaso: "Metaso Search",
  yujing: "Yujing",
  cozekj: "Coze Space",
  "youdao-fm": "Youdao Doc FM",
  autotypesetting: "Document Typesetting Tool",
  klingai: "Kolors",
  "loki-image-toolbox": "Loki Image Toolbox",
  zhuque: "Tencent Zhuque AI Detector",
  yueliu: "Yueliu",
  gjcool: "Ancient Books Cool",
  baimiao: "Baimiao",
  kimippt: "Kimi PPT Assistant",
  gaoding: "Gaoding Design",
  qqtools: "Bangxiaomang",
  wenxinlyrics: "Wenxin Lyrics",
  "picwish-sharpener": "PicWish Image Enhancer",
  "elevenlabs-cn": "ElevenLabs (CN)",
  gaituya: "Gaituya",
  "ai-huazuo": "AI Studio",
  nami: "Nami AI Search",
};

const TOOL_DESC_EN: Record<string, string> = {
  chatgpt:
    "A leading all-purpose AI assistant from OpenAI for writing, analysis, coding, and Q&A.",
  claude:
    "Anthropic's assistant optimized for long-form writing, reasoning, and high-quality output.",
  deepseek:
    "A powerful assistant focused on strong Chinese performance, coding support, and cost efficiency.",
  doubao:
    "ByteDance's AI assistant for everyday chat, writing, and productivity tasks.",
  gemini:
    "Google's multimodal AI assistant for writing, reasoning, and cross-app workflows.",
  monica:
    "An integrated AI workspace that combines multiple models and utilities in one place.",
};

const CATEGORY_DESC_EN: Record<string, string> = {
  writing: "writing, chat, and knowledge assistance",
  image: "image generation and design creation",
  video: "video generation and editing",
  audio: "audio creation and speech workflows",
  office: "office productivity and document workflows",
  coding: "coding assistance and development tasks",
  utils: "practical utility and productivity tasks",
};

const titleCase = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function hasChinese(value: string | undefined): boolean {
  if (!value) return false;
  return zhCharRegex.test(value);
}

export function getLocalizedToolName(tool: Tool, locale: ToolLocale): string {
  if (locale !== "en") return tool.name;

  if (TOOL_NAME_EN[tool.id]) return TOOL_NAME_EN[tool.id];
  if (!hasChinese(tool.name)) return tool.name;

  return titleCase(tool.id);
}

export function getLocalizedToolDescription(tool: Tool, locale: ToolLocale): string {
  if (locale !== "en") return tool.description;

  if (TOOL_DESC_EN[tool.id]) return TOOL_DESC_EN[tool.id];
  if (!hasChinese(tool.description)) return tool.description;

  const localizedName = getLocalizedToolName(tool, "en");
  const categoryText = CATEGORY_DESC_EN[tool.toolCategory || "utils"] || "AI workflows";
  const scenarioLabels = resolveToolCoreScenarios(tool)
    .slice(0, 2)
    .map((scenarioId) => getCoreScenarioLabel(scenarioId, "en"))
    .filter(Boolean);
  const tagText = scenarioLabels.length > 0 ? ` Key scenarios include ${scenarioLabels.join(" and ")}.` : "";

  return `${localizedName} is an AI tool for ${categoryText}.${tagText}`;
}

export function localizeTool(tool: Tool, locale: ToolLocale): Tool {
  if (locale !== "en") return tool;
  return {
    ...tool,
    name: getLocalizedToolName(tool, "en"),
    description: getLocalizedToolDescription(tool, "en"),
  };
}
