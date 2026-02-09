import { ToolCategory } from "@/lib/types";

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "agent",
    name: "AI通用智能体",
    icon: "/icons/tool-categories/agent.svg",
  },
  {
    id: "office",
    name: "AI办公工具",
    icon: "/icons/tool-categories/productivity.svg",
  },
  {
    id: "image",
    name: "AI图像工具",
    icon: "/icons/tool-categories/image.svg",
  },
  {
    id: "writing",
    name: "AI写作工具",
    icon: "/icons/tool-categories/text.svg",
  },
  {
    id: "video",
    name: "AI视频工具",
    icon: "/icons/tool-categories/video.svg",
  },
  {
    id: "design",
    name: "AI设计工具",
    icon: "/icons/tool-categories/art.svg",
  },
  {
    id: "chat",
    name: "AI对话聊天",
    icon: "/icons/tool-categories/business.svg",
  },
  {
    id: "coding",
    name: "AI编程工具",
    icon: "/icons/tool-categories/code.svg",
  },
  {
    id: "audio",
    name: "AI音频工具",
    icon: "/icons/tool-categories/audio.svg",
  },
  {
    id: "dev-platform",
    name: "AI开发平台",
    icon: "/icons/tool-categories/automation.svg",
  },
  {
    id: "podcast",
    name: "AI播客工具",
    icon: "/icons/categories/podcast-mic.svg",
  },
  /**
   * 其他AI工具（misc）
   * ------------------
   * 用途: 兜底类。仅当工具以 AI 技术为核心、但暂未归入现有具体大类时使用。
   * 典型情况: 功能较为独特或垂直的 AI 应用，如 AI 水印检测、AI 简历筛选等。
   */
  {
    id: "misc",
    name: "其他AI工具",
    icon: "/icons/tool-categories/misc.svg",
  },
  /**
   * 效率小玩意（utils）
   * ------------------
   * 用途: 轻量、即用即走的效率工具，可有 AI 成分但并非以 AI 为核心卖点。
   * 典型情况: PDF 压缩、一键图文排版、格式转换等"做一件事"的小工具。
   * 注意: 若工具明显主打 AI 能力，应优先考虑归入具体 AI 分类或 misc。
   */
  {
    id: "utils",
    name: "四次元小工具",
    icon: "/icons/categories/briefcase.svg",
  }
]; 
