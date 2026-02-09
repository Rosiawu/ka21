#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FeaturedConfig, FeaturedCategory, ValidationResult } from '../src/types/featured';

// 工具数据类型定义
interface Tool {
  id: string;
  name: string;
  tags: string[];
  toolCategory: string;
  recommendLevel: 'high' | 'medium' | 'low';
  isVisible: boolean;
}

interface ToolCategory {
  id: string;
  name: string;
}

class FeaturedValidator {
  private tools: Tool[] = [];
  private categories: ToolCategory[] = [];
  private featuredConfig: FeaturedConfig | null = null;

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      // 加载工具数据
      const toolsPath = join(process.cwd(), 'src/data/tools.json');
      const toolsData = JSON.parse(readFileSync(toolsPath, 'utf-8'));
      this.tools = toolsData.tools;

      // 加载分类数据
      const categoriesPath = join(process.cwd(), 'src/data/toolCategories.ts');
      // 简化处理，直接读取分类ID列表
      this.categories = [
        { id: 'agent', name: 'AI通用智能体' },
        { id: 'office', name: 'AI办公工具' },
        { id: 'image', name: 'AI图像工具' },
        { id: 'writing', name: 'AI写作工具' },
        { id: 'video', name: 'AI视频工具' },
        { id: 'design', name: 'AI设计工具' },
        { id: 'chat', name: 'AI对话聊天' },
        { id: 'coding', name: 'AI编程工具' },
        { id: 'audio', name: 'AI音频工具' },
        { id: 'dev-platform', name: 'AI开发平台' },
        { id: 'podcast', name: 'AI播客工具' },
        { id: 'misc', name: '其他AI工具' },
        { id: 'utils', name: '四次元小工具' }
      ];

      // 加载推荐配置
      const featuredPath = join(process.cwd(), 'src/data/featured.json');
      this.featuredConfig = JSON.parse(readFileSync(featuredPath, 'utf-8'));

    } catch (error) {
      console.error('加载数据失败:', error);
      process.exit(1);
    }
  }

  public validate(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.featuredConfig) {
      result.valid = false;
      result.errors.push('featured.json 配置文件不存在或格式错误');
      return result;
    }

    // 验证基本结构
    this.validateBasicStructure(result);
    
    // 验证分类配置
    this.validateCategories(result);
    
    // 验证工具ID
    this.validateToolIds(result);
    
    // 验证兜底策略
    this.validateBackupStrategy(result);

    return result;
  }

  private validateBasicStructure(result: ValidationResult) {
    const config = this.featuredConfig!;

    // 验证必需字段
    if (!config.version || typeof config.version !== 'string') {
      result.errors.push('version 字段缺失或类型错误');
    }

    if (!config.order || !Array.isArray(config.order)) {
      result.errors.push('order 字段缺失或类型错误');
    }

    if (!config.categories || typeof config.categories !== 'object') {
      result.errors.push('categories 字段缺失或类型错误');
    }

    // 验证order与categories的一致性
    if (config.order && config.categories) {
      const categoryKeys = Object.keys(config.categories);
      const missingInOrder = categoryKeys.filter(key => !config.order.includes(key));
      const missingInCategories = config.order.filter(key => !categoryKeys.includes(key));

      if (missingInOrder.length > 0) {
        result.errors.push(`categories 中存在但 order 中缺失的分类: ${missingInOrder.join(', ')}`);
      }

      if (missingInCategories.length > 0) {
        result.errors.push(`order 中存在但 categories 中缺失的分类: ${missingInCategories.join(', ')}`);
      }
    }
  }

  private validateCategories(result: ValidationResult) {
    const config = this.featuredConfig!;

    for (const [categoryKey, category] of Object.entries(config.categories)) {
      // 验证必需字段
      const requiredFields = ['title', 'subtitle', 'icon', 'featured_tools', 'backup_tags', 'view_all_href'];
      for (const field of requiredFields) {
        if (!category[field as keyof FeaturedCategory]) {
          result.errors.push(`分类 ${categoryKey} 缺少必需字段: ${field}`);
        }
      }

      // 验证featured_tools数组
      if (!Array.isArray(category.featured_tools)) {
        result.errors.push(`分类 ${categoryKey} 的 featured_tools 不是数组`);
      } else {
        // 检查分类内重复
        const uniqueTools = new Set(category.featured_tools);
        if (uniqueTools.size !== category.featured_tools.length) {
          result.errors.push(`分类 ${categoryKey} 的 featured_tools 中存在重复工具ID`);
        }
      }

      // 验证backup_tags数组
      if (!Array.isArray(category.backup_tags)) {
        result.errors.push(`分类 ${categoryKey} 的 backup_tags 不是数组`);
      }

      // 验证view_all_href格式
      if (typeof category.view_all_href !== 'string' || !category.view_all_href.startsWith('/')) {
        result.errors.push(`分类 ${categoryKey} 的 view_all_href 必须是以 / 开头的字符串`);
      }
    }
  }

  private validateToolIds(result: ValidationResult) {
    const config = this.featuredConfig!;
    const allToolIds = new Set(this.tools.map(tool => tool.id));

    for (const [categoryKey, category] of Object.entries(config.categories)) {
      for (const toolId of category.featured_tools) {
        if (!allToolIds.has(toolId)) {
          result.errors.push(`分类 ${categoryKey} 中的工具ID不存在: ${toolId}`);
        }
      }
    }
  }

  private validateBackupStrategy(result: ValidationResult) {
    const config = this.featuredConfig!;

    for (const [categoryKey, category] of Object.entries(config.categories)) {
      // 计算兜底池
      const backupPool = this.getBackupPool(category);
      
      if (backupPool.length < 4) {
        result.warnings.push(`分类 ${categoryKey} 兜底池工具数量过少 (${backupPool.length})，可能影响换一换功能`);
      }

      // 检查总可用工具数量
      const totalAvailable = category.featured_tools.length + backupPool.length;
      if (totalAvailable < 6) {
        result.warnings.push(`分类 ${categoryKey} 总可用工具数量过少 (${totalAvailable})，桌面端可能无法显示6个工具`);
      }
    }
  }

  private getBackupPool(category: FeaturedCategory): string[] {
    const backupToolIds = new Set<string>();

    // 基于标签查找
    for (const tool of this.tools) {
      if (!tool.isVisible) continue;
      
      const hasMatchingTag = category.backup_tags.some(tag => 
        tool.tags.includes(tag)
      );
      
      const hasMatchingCategory = category.backup_categories?.some(cat => 
        tool.toolCategory === cat
      );

      if (hasMatchingTag || hasMatchingCategory) {
        // 排除已经在featured_tools中的工具
        if (!category.featured_tools.includes(tool.id)) {
          backupToolIds.add(tool.id);
        }
      }
    }

    // 按推荐等级和名称排序
    return Array.from(backupToolIds).sort((a, b) => {
      const toolA = this.tools.find(t => t.id === a)!;
      const toolB = this.tools.find(t => t.id === b)!;
      
      const levelOrder = { high: 3, medium: 2, low: 1 };
      const levelDiff = levelOrder[toolB.recommendLevel] - levelOrder[toolA.recommendLevel];
      
      if (levelDiff !== 0) return levelDiff;
      
      return toolA.name.localeCompare(toolB.name);
    });
  }
}

// 执行验证
function main() {
  console.log('🔍 开始验证 featured.json 配置...\n');

  const validator = new FeaturedValidator();
  const result = validator.validate();

  console.log('📊 验证结果:');
  console.log(`✅ 有效: ${result.valid}`);
  console.log(`❌ 错误: ${result.errors.length}`);
  console.log(`⚠️  警告: ${result.warnings.length}\n`);

  if (result.errors.length > 0) {
    console.log('❌ 错误详情:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  警告详情:');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
    console.log('');
  }

  if (result.valid) {
    console.log('🎉 配置验证通过！');
    process.exit(0);
  } else {
    console.log('💥 配置验证失败，请修复错误后重试！');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export default FeaturedValidator;