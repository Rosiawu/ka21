/**
 * tutorials.json类型声明
 * 
 * tutorials.json数据结构说明:
 * 
 * TutorialData包含一篇教程的所有信息:
 * - id: 全局唯一标识符
 * - title: 教程标题
 * - url: 教程链接
 * - source: 来源/作者信息
 * - difficultyLevel: 难度级别(小白入门/萌新进阶/高端玩家)
 * - category: 分类(AI大模型/AI绘画等)
 * - skillTags: 技能标签数组
 * - recommendReason: 推荐理由
 * - relatedTools: 关联的工具ID数组，建立双向关联
 * 
 * meta包含整体元数据:
 * - version: 数据版本号
 * - updatedAt: 最后更新时间
 * - count: 教程总数
 */

import { DifficultyLevel } from '@/data/tutorials';

/**
 * 教程数据接口
 * 独立于工具数据的完整教程信息
 */
export interface TutorialData {
  id: string;               // 全局唯一ID (格式:tutorial-domain-title-index)
  title: string;            // 教程标题
  description?: string;     // 可选描述，如果没有会使用标题代替
  url: string;              // 教程链接URL
  source: string;           // 来源或作者名称
  publishDate: string;      // 发布日期 (YYYY-MM-DD格式)
  difficultyLevel: DifficultyLevel; // 难度级别
  category: string;         // 内容分类
  skillTags: string[];      // 相关技能标签
  recommendReason?: string; // 推荐理由
  customImageUrl?: string | null; // 自定义图片URL，如果没有会使用生成的图片
  relatedTools: string[];   // 关联工具ID列表，建立双向关联
}

/**
 * 教程数据元信息
 * 包含数据版本、更新时间和统计信息
 */
export interface TutorialsMeta {
  version: string;          // 数据版本号
  updatedAt: string;        // 最后更新时间
  count: number;            // 教程数量
}

/**
 * 完整的tutorials.json文件结构
 */
export interface TutorialsJson {
  tutorials: TutorialData[]; // 所有教程数据数组
  meta: TutorialsMeta;       // 元数据
}

declare module '*/tutorials.json' {
  const value: TutorialsJson;
  export default value;
} 