/* eslint-env node */
/* eslint-config-path .eslintrc.scripts.js */

const fs = require('fs');
const path = require('path');

// 读取工具数据
const toolsFilePath = path.join(__dirname, '../data/tools.json');
const toolsData = JSON.parse(fs.readFileSync(toolsFilePath, 'utf8'));

// 定义分类映射关系（旧分类ID -> 新分类ID）
const categoryMapping = {
  // 旧分类 -> 新分类
  'productivity': 'office',   // 生产力工具 -> AI办公工具
  'video': 'video',           // 视频工具 -> AI视频工具 (不变)
  'text': 'writing',          // 文本工具 -> AI写作工具
  'business': 'chat',         // 商业工具 -> AI对话聊天 (根据实际内容可能需要调整)
  'image': 'image',           // 图像工具 -> AI图像工具 (不变)
  'automation': 'dev-platform', // 自动化工具 -> AI开发平台
  'art': 'design',            // 艺术工具 -> AI设计工具
  'audio': 'audio',           // 音频工具 -> AI音频工具 (不变)
  'misc': 'misc',             // 其他工具 -> 其他AI工具 (不变)
  'code': 'coding',           // 代码工具 -> AI编程工具
  
  // 新分类 -> 新分类（保持不变）
  'writing': 'writing',       // 已经是新分类，保持不变
  'office': 'office',         // 已经是新分类，保持不变
  'design': 'design',         // 已经是新分类，保持不变
  'chat': 'chat',             // 已经是新分类，保持不变
  'coding': 'coding',         // 已经是新分类，保持不变
  'dev-platform': 'dev-platform' // 已经是新分类，保持不变
};

// 特定工具的分类映射
const specificToolMapping = {
  'deepseek': 'chat',         // AI对话工具
  'gamma': 'office',          // AI办公工具
  'freedraw': 'design',       // AI设计工具
  'leonardo': 'image',        // AI图像工具
  'mistral': 'image'          // AI图像工具
};

// 基于标签的分类推断 (如果没有分类或分类不正确)
const tagBasedMapping = {
  // 写作相关标签
  'content-writing': 'writing',
  'copywriting': 'writing',
  'ai-writing': 'writing',
  'writing-assistant': 'writing',
  'blog-writing': 'writing',
  
  // 图像相关标签
  'image-generation': 'image',
  'ai-image': 'image',
  'text-to-image': 'image',
  
  // 视频相关标签
  'video-generation': 'video',
  'video-editing': 'video',
  'ai-video': 'video',
  
  // 办公相关标签
  'productivity': 'office',
  'workflow': 'office',
  'spreadsheet': 'office',
  'document': 'office',
  
  // 设计相关标签
  'design': 'design',
  'ui-design': 'design',
  'illustration': 'design',
  'art': 'design',
  
  // 聊天相关标签
  'ai-chat': 'chat',
  'chatbot': 'chat',
  'conversation': 'chat',
  
  // 编程相关标签
  'coding': 'coding',
  'code-generation': 'coding',
  'programming': 'coding',
  'developer-tools': 'coding',
  
  // 音频相关标签
  'audio': 'audio',
  'text-to-speech': 'audio',
  'music': 'audio',
  'voice': 'audio',
  
  // 开发平台相关标签
  'api': 'dev-platform',
  'platform': 'dev-platform',
  'sdk': 'dev-platform',
  'development': 'dev-platform',
};

// 有效的新分类列表
const validCategories = [
  'writing', 'image', 'video', 'office',
  'design', 'chat', 'coding', 'audio',
  'dev-platform', 'misc'
];

// 统计
let updated = 0;
let unchanged = 0;
let tagBased = 0;

// 更新每个工具的分类
toolsData.tools = toolsData.tools.map(tool => {
  // 首先检查是否有特定工具映射
  if (specificToolMapping[tool.id]) {
    const newCategory = specificToolMapping[tool.id];
    if (tool.toolCategory !== newCategory) {
      console.log(`工具 "${tool.name}" (${tool.id}) 分类从 "${tool.toolCategory}" 更新为 "${newCategory}"`);
      tool.toolCategory = newCategory;
      updated++;
    } else {
      unchanged++;
    }
    return tool;
  }
  
  // 如果工具没有分类，基于标签推断
  if (!tool.toolCategory) {
    // 遍历工具的标签，查找第一个匹配的分类
    for (const tag of tool.tags) {
      if (tagBasedMapping[tag]) {
        tool.toolCategory = tagBasedMapping[tag];
        tagBased++;
        break;
      }
    }
    
    // 如果仍然没有分类，默认为其他AI工具
    if (!tool.toolCategory) {
      tool.toolCategory = 'misc';
      tagBased++;
    }
    
    return tool;
  }
  
  // 如果工具有分类
  const currentCategory = tool.toolCategory;
  
  // 检查当前分类是否已经是有效的新分类
  if (validCategories.includes(currentCategory)) {
    unchanged++;
    return tool;
  }
  
  // 如果当前分类需要映射到新分类
  if (categoryMapping[currentCategory]) {
    const newCategory = categoryMapping[currentCategory];
    tool.toolCategory = newCategory;
    
    // 检查是否实际发生了变化
    if (currentCategory !== newCategory) {
      console.log(`工具 "${tool.name}" 分类从 "${currentCategory}" 更新为 "${newCategory}"`);
      updated++;
    } else {
      unchanged++;
    }
  } else {
    // 如果当前分类不在映射表中，尝试通过标签推断
    let tagFound = false;
    for (const tag of tool.tags) {
      if (tagBasedMapping[tag]) {
        tool.toolCategory = tagBasedMapping[tag];
        tagBased++;
        tagFound = true;
        break;
      }
    }
    
    // 如果标签也无法推断，则设置为其他AI工具
    if (!tagFound) {
      console.log(`未知分类 "${currentCategory}" 为工具 "${tool.name}"，设置为 "misc"，标签: ${tool.tags.join(', ')}`);
      tool.toolCategory = 'misc';
      updated++;
    }
  }
  
  return tool;
});

// 写回文件
fs.writeFileSync(toolsFilePath, JSON.stringify(toolsData, null, 2), 'utf8');

console.log(`更新完成:`);
console.log(`- 已更新分类: ${updated}个`);
console.log(`- 保持不变: ${unchanged}个`);
console.log(`- 基于标签推断: ${tagBased}个`);
console.log(`总计: ${updated + unchanged + tagBased}个工具`);
console.log(`更新后的数据已保存到 ${toolsFilePath}`); 