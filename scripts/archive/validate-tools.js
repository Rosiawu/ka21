/* eslint-disable @typescript-eslint/no-require-imports */
// 验证工具数据的脚本
const fs = require('fs');
const path = require('path');

// 工作目录
const workspaceDir = process.cwd();
console.log('当前工作目录:', workspaceDir);

// 文件路径
const toolsJsonPath = path.resolve(workspaceDir, 'src/data/tools.json');

// 验证函数
function validateTool(tool) {
  const errors = [];

  // 验证必需字段
  if (!tool.id || typeof tool.id !== 'string') errors.push(`id无效或缺失`);
  if (!tool.name || typeof tool.name !== 'string') errors.push(`name无效或缺失`);
  if (!tool.description || typeof tool.description !== 'string') errors.push(`description无效或缺失`);
  if (!tool.url || typeof tool.url !== 'string') errors.push(`url无效或缺失`);
  
  // 验证图标字段
  if (tool.icons !== undefined && tool.icons !== null) {
    if (typeof tool.icons !== 'object') errors.push(`icons不是对象类型`);
    else {
      if (tool.icons.svg !== undefined && typeof tool.icons.svg !== 'string') errors.push(`icons.svg不是字符串类型`);
      if (tool.icons.png !== undefined && typeof tool.icons.png !== 'string') errors.push(`icons.png不是字符串类型`);
    }
  }
  
  if (tool.icon !== undefined && typeof tool.icon !== 'string') errors.push(`icon不是字符串类型`);
  
  // 验证标签数组
  if (!Array.isArray(tool.tags)) {
    errors.push(`tags不是数组类型`);
  } else if (!tool.tags.every(tag => typeof tag === 'string')) {
    errors.push(`tags数组中有非字符串元素`);
  }

  // 验证业务分类
  if (tool.businessCategory !== undefined) {
    const validCategories = [
      'customer-support', 
      'sales', 
      'back-office', 
      'operations', 
      'growth-marketing', 
      'writing-editing', 
      'technology-it', 
      'design-creative', 
      'workflow-automation'
    ];
    if (!validCategories.includes(tool.businessCategory)) {
      errors.push(`businessCategory '${tool.businessCategory}' 不是有效值`);
    }
  }
  
  // 验证工具类型分类
  if (tool.toolCategory !== undefined) {
    const validToolCategories = [
      'writing',
      'image',
      'video',
      'office',
      'design',
      'chat',
      'coding',
      'audio',
      'dev-platform',
      'agent',
      'podcast',
      'misc'
    ];
    if (!validToolCategories.includes(tool.toolCategory)) {
      errors.push(`toolCategory '${tool.toolCategory}' 不是有效值`);
    }
  }

  // 验证推荐等级
  if (tool.recommendLevel !== undefined) {
    const validLevels = ['high', 'medium', 'low'];
    if (!validLevels.includes(tool.recommendLevel)) {
      errors.push(`recommendLevel '${tool.recommendLevel}' 不是有效值`);
    }
  }

  // 验证可访问性
  if (tool.accessibility !== undefined) {
    const validAccessibility = ['直接访问', '需要代理'];
    if (!validAccessibility.includes(tool.accessibility)) {
      errors.push(`accessibility '${tool.accessibility}' 不是有效值`);
    }
  }

  // 验证指南数组
  if (tool.guides !== undefined) {
    if (!Array.isArray(tool.guides)) {
      errors.push(`guides不是数组类型`);
    } else {
      tool.guides.forEach((guide, guideIndex) => {
        if (!guide || typeof guide !== 'object') errors.push(`guides[${guideIndex}]不是对象类型`);
        else {
          if (!guide.title || typeof guide.title !== 'string') errors.push(`guides[${guideIndex}].title无效或缺失`);
          if (!guide.content || typeof guide.content !== 'string') errors.push(`guides[${guideIndex}].content无效或缺失`);
          if (!guide.type || !['video', 'text', '注意事项'].includes(guide.type)) {
            errors.push(`guides[${guideIndex}].type '${guide.type}' 不是有效值`);
          }
        }
      });
    }
  }

  // 验证相关文章数组
  if (tool.relatedArticles !== undefined) {
    if (!Array.isArray(tool.relatedArticles)) {
      errors.push(`relatedArticles不是数组类型`);
    } else {
      tool.relatedArticles.forEach((article, articleIndex) => {
        if (!article || typeof article !== 'object') errors.push(`relatedArticles[${articleIndex}]不是对象类型`);
        else {
          if (!article.title || typeof article.title !== 'string') errors.push(`relatedArticles[${articleIndex}].title无效或缺失`);
          if (!article.url || typeof article.url !== 'string') errors.push(`relatedArticles[${articleIndex}].url无效或缺失`);
          if (article.source !== undefined && typeof article.source !== 'string') errors.push(`relatedArticles[${articleIndex}].source不是字符串类型`);
          if (article.publishDate !== undefined && typeof article.publishDate !== 'string') errors.push(`relatedArticles[${articleIndex}].publishDate不是字符串类型`);
          
          // 验证自定义分类
          if (article.customCategory !== undefined && typeof article.customCategory !== 'string') {
            errors.push(`relatedArticles[${articleIndex}].customCategory不是字符串类型`);
          }
          
          // 验证自定义难度级别
          if (article.customDifficultyLevel !== undefined) {
            const validDifficultyLevels = ['小白入门', '萌新进阶', '高端玩家'];
            if (!validDifficultyLevels.includes(article.customDifficultyLevel)) {
              errors.push(`relatedArticles[${articleIndex}].customDifficultyLevel '${article.customDifficultyLevel}' 不是有效值`);
            }
          }
          
          // 验证自定义技能标签
          if (article.customSkillTags !== undefined) {
            if (!Array.isArray(article.customSkillTags)) {
              errors.push(`relatedArticles[${articleIndex}].customSkillTags不是数组类型`);
            } else if (!article.customSkillTags.every(tag => typeof tag === 'string')) {
              errors.push(`relatedArticles[${articleIndex}].customSkillTags数组中有非字符串元素`);
            }
          }
          
          // 验证自定义图片URL
          if (article.customImageUrl !== undefined && typeof article.customImageUrl !== 'string') {
            errors.push(`relatedArticles[${articleIndex}].customImageUrl不是字符串类型`);
          }
          
          // 验证推荐理由
          if (article.customRecommendReason !== undefined && typeof article.customRecommendReason !== 'string') {
            errors.push(`relatedArticles[${articleIndex}].customRecommendReason不是字符串类型`);
          }
        }
      });
    }
  }
  
  // 验证群友点评数组
  if (tool.groupComments !== undefined) {
    if (!Array.isArray(tool.groupComments)) {
      errors.push(`groupComments不是数组类型`);
    } else {
      tool.groupComments.forEach((comment, commentIndex) => {
        if (!comment || typeof comment !== 'object') errors.push(`groupComments[${commentIndex}]不是对象类型`);
        else {
          if (!comment.content || typeof comment.content !== 'string') errors.push(`groupComments[${commentIndex}].content无效或缺失`);
          if (comment.author !== undefined && typeof comment.author !== 'string') errors.push(`groupComments[${commentIndex}].author不是字符串类型`);
          if (comment.createdAt !== undefined && typeof comment.createdAt !== 'string') errors.push(`groupComments[${commentIndex}].createdAt不是字符串类型`);
          if (comment.reviewType !== undefined && typeof comment.reviewType !== 'string') errors.push(`groupComments[${commentIndex}].reviewType不是字符串类型`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 读取工具数据
let toolsData;
try {
  console.log('读取工具数据文件:', toolsJsonPath);
  const fileContent = fs.readFileSync(toolsJsonPath, 'utf8');
  
  // 检查BOM
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    console.warn('警告: 文件包含BOM标记，将自动移除');
    toolsData = JSON.parse(fileContent.slice(1));
  } else {
    toolsData = JSON.parse(fileContent);
  }

  if (!toolsData.tools || !Array.isArray(toolsData.tools)) {
    console.error('错误: 工具数据不是预期的格式，缺少tools数组');
    process.exit(1);
  }

  console.log(`成功读取工具数据，包含 ${toolsData.tools.length} 个工具`);
} catch (error) {
  console.error('读取或解析工具数据失败:', error.message);
  process.exit(1);
}

// 验证每个工具
console.log('开始验证工具数据...');
const results = [];
let validCount = 0;
let invalidCount = 0;

toolsData.tools.forEach((tool, index) => {
  const result = validateTool(tool);
  
  if (result.valid) {
    validCount++;
  } else {
    invalidCount++;
    results.push({
      index,
      id: tool.id || `未知ID-${index}`,
      name: tool.name || `未知名称-${index}`,
      errors: result.errors
    });
  }
});

// 打印验证结果
console.log(`\n验证结果:`);
console.log(`总工具数: ${toolsData.tools.length}`);
console.log(`有效工具数: ${validCount}`);
console.log(`无效工具数: ${invalidCount}`);

if (invalidCount > 0) {
  console.log('\n无效工具详情:');
  results.forEach(result => {
    console.log(`\n[${result.index}] ${result.name} (${result.id}):`);
    result.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  });
  
  // 提供修复建议
  console.log('\n建议修复步骤:');
  console.log('1. 根据上述错误修复无效工具的数据');
  console.log('2. 对于"accessibility"字段，确保值为"直接访问"或"需要代理"');
  console.log('3. 对于分类字段，确保使用有效的值');
  console.log('4. 保存修复后的文件，注意避免引入BOM标记');
} 