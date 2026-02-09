/* eslint-disable @typescript-eslint/no-require-imports */
// 修复工具数据的脚本
const fs = require('fs');
const path = require('path');

// 工作目录
const workspaceDir = process.cwd();
console.log('当前工作目录:', workspaceDir);

// 文件路径
const toolsJsonPath = path.resolve(workspaceDir, 'src/data/tools.json');
const outputPath = path.resolve(workspaceDir, 'src/data/tools_fixed_final.json');

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

// 修复工具数据问题
console.log('开始修复工具数据...');
let fixedCount = 0;

// 修复Grok的businessCategory问题
const grokTool = toolsData.tools.find(tool => tool.id === 'grok');
if (grokTool) {
  if (grokTool.businessCategory === 'productivity') {
    console.log(`修复 Grok 的 businessCategory: productivity -> technology-it`);
    grokTool.businessCategory = 'technology-it'; // 修改为有效的业务分类
    fixedCount++;
  }
}

// 检查所有工具是否有其他问题
toolsData.tools.forEach(tool => {
  // 修复所有可能的魔法值
  if (tool.accessibility === '需要魔法') {
    console.log(`修复 ${tool.name} 的 accessibility: 需要魔法 -> 需要代理`);
    tool.accessibility = '需要代理';
    fixedCount++;
  }
  
  // 检查并修复businessCategory
  const validBusinessCategories = [
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
  
  if (tool.businessCategory && !validBusinessCategories.includes(tool.businessCategory)) {
    console.log(`修复 ${tool.name} 的无效 businessCategory: ${tool.businessCategory} -> design-creative`);
    tool.businessCategory = 'design-creative'; // 默认分类
    fixedCount++;
  }
  
  // 检查并修复toolCategory
  const validToolCategories = [
    'productivity',
    'video',
    'text',
    'business',
    'image',
    'automation',
    'art',
    'audio',
    'misc',
    'code'
  ];
  
  if (tool.toolCategory && !validToolCategories.includes(tool.toolCategory)) {
    console.log(`修复 ${tool.name} 的无效 toolCategory: ${tool.toolCategory} -> productivity`);
    tool.toolCategory = 'productivity'; // 默认分类
    fixedCount++;
  }
});

// 备份原始文件
const backupPath = `${toolsJsonPath}.bak.${Date.now()}`;
fs.copyFileSync(toolsJsonPath, backupPath);
console.log(`创建备份: ${backupPath}`);

// 写入修复后的数据
try {
  fs.writeFileSync(outputPath, JSON.stringify(toolsData, null, 2), 'utf8');
  console.log(`成功保存修复后的数据到: ${outputPath}`);
  
  // 替换原始文件
  fs.copyFileSync(outputPath, toolsJsonPath);
  console.log(`成功替换原始数据文件`);
} catch (error) {
  console.error('写入修复后的数据失败:', error.message);
  process.exit(1);
}

console.log('工具修复完成!');
console.log(`总共修复了 ${fixedCount} 个问题`); 