/* eslint-disable @typescript-eslint/no-require-imports */
// 更新工具数据的脚本
const fs = require('fs');
const path = require('path');

// 工作目录
const workspaceDir = process.cwd();
console.log('当前工作目录:', workspaceDir);

// 文件路径
const fixedToolsPath = path.resolve(workspaceDir, 'src/data/tools_fixed.json');
const toolsJsonPath = path.resolve(workspaceDir, 'src/data/tools.json');

console.log('修复后数据文件路径:', fixedToolsPath);
console.log('目标工具数据文件路径:', toolsJsonPath);

// 检查文件是否存在
if (!fs.existsSync(fixedToolsPath)) {
  console.error(`错误: 修复后数据文件不存在: ${fixedToolsPath}`);
  process.exit(1);
}

if (!fs.existsSync(toolsJsonPath)) {
  console.error(`错误: 目标工具数据文件不存在: ${toolsJsonPath}`);
  process.exit(1);
}

// 读取修复后的数据
let fixedData;
try {
  const fixedFileContent = fs.readFileSync(fixedToolsPath, 'utf8');
  fixedData = JSON.parse(fixedFileContent);
  console.log(`成功读取修复后数据，包含 ${fixedData.tools ? fixedData.tools.length : 0} 个工具`);
} catch (error) {
  console.error('读取修复后数据失败:', error.message);
  process.exit(1);
}

// 读取现有工具数据
let currentData;
try {
  const currentFileContent = fs.readFileSync(toolsJsonPath, 'utf8');
  currentData = JSON.parse(currentFileContent);
  console.log(`成功读取现有工具数据，包含 ${currentData.tools ? currentData.tools.length : 0} 个工具`);
} catch (error) {
  console.error('读取现有工具数据失败:', error.message);
  process.exit(1);
}

// 创建一个工具ID映射，用于快速查找
const toolIdMap = {};
currentData.tools.forEach(tool => {
  toolIdMap[tool.id] = true;
});

// 合并数据
let updatedTools = [...currentData.tools];
let updatedCount = 0;
let addedCount = 0;

// 添加或更新工具
fixedData.tools.forEach(newTool => {
  const index = updatedTools.findIndex(tool => tool.id === newTool.id);
  if (index !== -1) {
    // 更新现有工具
    updatedTools[index] = newTool;
    console.log(`更新工具: ${newTool.name} (${newTool.id})`);
    updatedCount++;
  } else {
    // 添加新工具
    updatedTools.push(newTool);
    console.log(`添加新工具: ${newTool.name} (${newTool.id})`);
    addedCount++;
  }
});

// 准备更新后的数据
const updatedData = {
  tools: updatedTools
};

// 创建备份
const backupPath = `${toolsJsonPath}.bak.${Date.now()}`;
fs.copyFileSync(toolsJsonPath, backupPath);
console.log(`创建备份: ${backupPath}`);

// 写入更新后的数据
try {
  fs.writeFileSync(toolsJsonPath, JSON.stringify(updatedData, null, 2), 'utf8');
  console.log('成功更新工具数据!');
} catch (error) {
  console.error('写入更新后的数据失败:', error.message);
  process.exit(1);
}

console.log('工具更新完成!');
console.log(`总共处理 ${fixedData.tools.length} 个工具`);
console.log(`- 更新了 ${updatedCount} 个现有工具`);
console.log(`- 添加了 ${addedCount} 个新工具`);
console.log(`现在共有 ${updatedTools.length} 个工具`); 