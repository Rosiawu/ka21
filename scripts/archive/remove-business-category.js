/* eslint-env node */
/* eslint-config-path .eslintrc.scripts.js */

const fs = require('fs');
const path = require('path');

// 读取工具数据
const toolsFilePath = path.join(__dirname, '../data/tools.json');
const toolsData = JSON.parse(fs.readFileSync(toolsFilePath, 'utf8'));

let count = 0;

// 对每个工具处理
toolsData.tools = toolsData.tools.map(tool => {
  if (tool.businessCategory) {
    delete tool.businessCategory;
    count++;
  }
  return tool;
});

// 写回文件
fs.writeFileSync(toolsFilePath, JSON.stringify(toolsData, null, 2), 'utf8');

console.log(`已从 ${count} 个工具中移除 businessCategory 属性`);
console.log(`更新后的数据已保存到 ${toolsFilePath}`); 