import { ToolCategoryId } from "@/lib/types";

export interface SearchIntentRule {
  id: string;
  label: string;
  keywords: string[];
  relatedQueries: string[];
  toolCategories?: ToolCategoryId[];
  toolTags?: string[];
  tutorialCategories?: string[];
  tutorialKeywords?: string[];
  boostToolIds?: string[];
  boostTutorialIds?: string[];
}

export interface QueryAliasRule {
  trigger: string;
  expansions: string[];
  intentIds?: string[];
}

export const HOT_SEARCH_QUERIES: string[] = [
  "DeepSeek",
  "ChatGPT",
  "Claude",
  "AI绘画",
  "AI视频",
  "PPT",
  "飞书多维表格",
  "AI编程",
  "智能体",
  "效率工具",
];

export const SEARCH_INTENT_RULES: SearchIntentRule[] = [
  {
    id: "office-efficiency",
    label: "办公提效",
    keywords: ["效率", "办公", "workflow", "自动化", "日报", "表格", "飞书", "office"],
    relatedQueries: ["效率工具", "飞书多维表格", "自动化工作流", "办公AI"],
    toolCategories: ["office", "utils", "writing"],
    toolTags: ["productivity", "automation", "office", "collaboration"],
    tutorialCategories: ["AI效率", "AI办公", "飞书多维表格"],
    tutorialKeywords: ["效率", "飞书", "自动化", "工作流", "表格"],
    boostToolIds: ["tongyi-efficiency", "feishu-base", "ima", "mineru"],
  },
  {
    id: "ppt-doc",
    label: "PPT与文档",
    keywords: ["ppt", "演示", "文档", "汇报", "课件", "slide"],
    relatedQueries: ["PPT", "AI课件", "演示文稿", "文档生成"],
    toolCategories: ["office", "image", "writing"],
    toolTags: ["presentation", "content-generation", "productivity"],
    tutorialCategories: ["AI效率", "AI办公"],
    tutorialKeywords: ["PPT", "课件", "文档", "汇报"],
    boostToolIds: ["gamma", "anygen", "freedraw"],
  },
  {
    id: "writing-copy",
    label: "写作与文案",
    keywords: ["写作", "文案", "公众号", "总结", "润色", "翻译", "笔记", "copywriting"],
    relatedQueries: ["AI写作", "文案生成", "公众号排版", "内容总结"],
    toolCategories: ["writing", "office"],
    toolTags: ["ai-writing", "content-generation", "summarization", "translation"],
    tutorialCategories: ["AI效率", "AI大模型"],
    tutorialKeywords: ["写作", "文案", "总结", "提示词"],
    boostToolIds: ["chatgpt", "claude", "deepseek", "doubao", "getbiji"],
  },
  {
    id: "image-design",
    label: "图像设计",
    keywords: ["画图", "生图", "海报", "设计", "修图", "抠图", "logo", "image"],
    relatedQueries: ["AI绘画", "AI设计", "海报生成", "图像编辑"],
    toolCategories: ["image", "utils"],
    toolTags: ["ai-image", "ai-design", "image-editing", "creativity"],
    tutorialCategories: ["AI绘画", "AI图像", "AI设计"],
    tutorialKeywords: ["生图", "绘画", "修图", "设计", "提示词"],
    boostToolIds: ["midjourney", "flux", "recraft", "ideogram", "remove-bg", "jm"],
  },
  {
    id: "video-create",
    label: "视频制作",
    keywords: ["视频", "剪辑", "短视频", "分镜", "特效", "口播", "video"],
    relatedQueries: ["AI视频", "视频剪辑", "分镜生成", "短片制作"],
    toolCategories: ["video", "image"],
    toolTags: ["ai-video", "video-editing", "video-generation"],
    tutorialCategories: ["AI视频", "AI效率"],
    tutorialKeywords: ["视频", "分镜", "剪辑", "短片"],
    boostToolIds: ["runway", "kling-ai", "hailuo", "seko", "veo", "jm-video"],
  },
  {
    id: "coding-dev",
    label: "编程开发",
    keywords: ["编程", "代码", "开发", "插件", "debug", "脚本", "coding"],
    relatedQueries: ["AI编程", "代码生成", "开发助手", "编程小白"],
    toolCategories: ["coding", "utils", "writing"],
    toolTags: ["ai-code", "development", "productivity"],
    tutorialCategories: ["AI编程", "AI大模型"],
    tutorialKeywords: ["编程", "代码", "插件", "网页"],
    boostToolIds: ["cursor", "trae", "windsurf", "chatgpt"],
  },
  {
    id: "audio-podcast",
    label: "音频播客",
    keywords: ["配音", "语音", "播客", "音乐", "音频", "tts", "stt"],
    relatedQueries: ["AI音频", "播客制作", "文本转语音", "音乐生成"],
    toolCategories: ["audio", "utils"],
    toolTags: ["ai-audio", "text-to-speech", "speech-to-text", "ai-podcast"],
    tutorialCategories: ["AI音频", "AI播客"],
    tutorialKeywords: ["音频", "配音", "播客", "音乐"],
    boostToolIds: ["suno", "ttsmaker", "listenhub", "tongyi-tingwu"],
  },
  {
    id: "agent-automation",
    label: "智能体与自动化",
    keywords: ["agent", "智能体", "自动执行", "工作流", "mcp", "automation"],
    relatedQueries: ["AI智能体", "自动化流程", "无代码智能体", "Agent工具"],
    toolCategories: ["utils", "writing", "office"],
    toolTags: ["automation", "ai-assistant", "no-code"],
    tutorialCategories: ["AI智能体", "AI通用智能体", "AI大模型"],
    tutorialKeywords: ["智能体", "自动化", "工作流", "MCP"],
    boostToolIds: ["coze", "tiangong", "hatch", "manus"],
  },
];

// 口语化搜索别名：将用户自然表达映射到可识别的意图关键词
export const QUERY_ALIAS_RULES: QueryAliasRule[] = [
  {
    trigger: "做短剧",
    expansions: ["视频", "短视频", "分镜", "剧情", "剪辑"],
    intentIds: ["video-create"],
  },
  {
    trigger: "短剧",
    expansions: ["视频", "短视频", "分镜"],
    intentIds: ["video-create"],
  },
  {
    trigger: "写东西",
    expansions: ["写作", "文案", "文章", "总结"],
    intentIds: ["writing-copy"],
  },
  {
    trigger: "写文章",
    expansions: ["写作", "文案", "文章"],
    intentIds: ["writing-copy"],
  },
  {
    trigger: "做视频",
    expansions: ["视频", "短视频", "剪辑"],
    intentIds: ["video-create"],
  },
  {
    trigger: "做图",
    expansions: ["画图", "生图", "设计", "海报"],
    intentIds: ["image-design"],
  },
  {
    trigger: "写代码",
    expansions: ["编程", "代码", "开发"],
    intentIds: ["coding-dev"],
  },
  {
    trigger: "做播客",
    expansions: ["播客", "音频", "配音"],
    intentIds: ["audio-podcast"],
  },
  {
    trigger: "做智能体",
    expansions: ["智能体", "agent", "自动化"],
    intentIds: ["agent-automation"],
  },
];
