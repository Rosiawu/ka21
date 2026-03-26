import { ToolCategory } from "@/lib/types";

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "writing",
    name: "写文案",
    icon: "/icons/tool-categories/text.svg",
    description: "写作、聊天、智能问答"
  },
  {
    id: "image",
    name: "做设计",
    icon: "/icons/tool-categories/image.svg",
    description: "画图、修图、海报设计"
  },
  {
    id: "video",
    name: "剪视频",
    icon: "/icons/tool-categories/video.svg",
    description: "视频生成、剪辑、特效"
  },
  {
    id: "audio",
    name: "听声音",
    icon: "/icons/tool-categories/audio.svg",
    description: "配音、音乐、语音转文字"
  },
  {
    id: "office",
    name: "办办公",
    icon: "/icons/tool-categories/productivity.svg",
    description: "PPT、文档、表格处理"
  },
  {
    id: "coding",
    name: "写代码",
    icon: "/icons/tool-categories/code.svg",
    description: "代码生成、编程助手"
  },
  {
    id: "utils",
    name: "小工具",
    icon: "/icons/categories/briefcase.svg",
    description: "效率神器、实用工具"
  }
]; 
