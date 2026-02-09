/* eslint-disable @typescript-eslint/no-require-imports */
// 修复测试工具数据的脚本
const fs = require('fs');
const path = require('path');

// 工作目录
const workspaceDir = process.cwd();
console.log('当前工作目录:', workspaceDir);

// 文件路径
const toolsTestPath = path.resolve(workspaceDir, 'src/data/tools_fixed_final.json');
const outputPath = path.resolve(workspaceDir, 'src/data/tools_fixed.json');

console.log('测试数据文件路径:', toolsTestPath);
console.log('输出文件路径:', outputPath);

// 检查文件是否存在
if (!fs.existsSync(toolsTestPath)) {
  console.error(`错误: 测试数据文件不存在: ${toolsTestPath}`);
  // 列出data目录下的文件
  const dataDir = path.resolve(workspaceDir, 'src/data');
  if (fs.existsSync(dataDir)) {
    console.log('src/data目录下的文件:');
    fs.readdirSync(dataDir).forEach(file => {
      console.log(`- ${file}`);
    });
  }
  process.exit(1);
}

// 读取测试数据
let testData;
try {
  const testFileContent = fs.readFileSync(toolsTestPath, 'utf8');
  testData = JSON.parse(testFileContent);
  console.log(`成功读取测试数据，包含 ${testData.tools ? testData.tools.length : 0} 个工具`);
} catch (error) {
  console.error('读取测试数据失败:', error.message);
  process.exit(1);
}

// 验证和修复测试数据
const fixedTools = testData.tools.map(tool => {
  // 创建工具的副本
  const fixedTool = { ...tool };
  
  // 修复"需要魔法"为"需要代理"
  if (fixedTool.accessibility === '需要魔法') {
    fixedTool.accessibility = '需要代理';
    console.log(`修复工具 ${fixedTool.name} 的accessibility: 需要魔法 -> 需要代理`);
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
  
  if (fixedTool.businessCategory && !validBusinessCategories.includes(fixedTool.businessCategory)) {
    console.warn(`警告: 工具 ${fixedTool.name} 的businessCategory无效: ${fixedTool.businessCategory}`);
    // 如果是"business-finance"这种情况，映射到合法值
    if (fixedTool.businessCategory === 'business-finance') {
      fixedTool.businessCategory = 'back-office';
      console.log(`修复工具 ${fixedTool.name} 的businessCategory: business-finance -> back-office`);
    }
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
  
  if (fixedTool.toolCategory && !validToolCategories.includes(fixedTool.toolCategory)) {
    console.warn(`警告: 工具 ${fixedTool.name} 的toolCategory无效: ${fixedTool.toolCategory}`);
    // 如果是"research"这种情况，映射到合法值
    if (fixedTool.toolCategory === 'research') {
      fixedTool.toolCategory = 'productivity';
      console.log(`修复工具 ${fixedTool.name} 的toolCategory: research -> productivity`);
    }
  }
  
  // 确保每个工具都有默认的业务分类
  if (!fixedTool.businessCategory) {
    fixedTool.businessCategory = 'design-creative'; // 默认分类
    console.log(`添加默认businessCategory到工具 ${fixedTool.name}`);
  }
  
  // 确保每个工具都有默认的工具类型分类
  if (!fixedTool.toolCategory) {
    fixedTool.toolCategory = 'productivity'; // 默认分类
    console.log(`添加默认toolCategory到工具 ${fixedTool.name}`);
  }
  
  // 优化图标处理
  if (!fixedTool.icons && fixedTool.icon) {
    fixedTool.icons = {
      png: fixedTool.icon
    };
    console.log(`为工具 ${fixedTool.name} 添加icons对象`);
  }
  
  return fixedTool;
});

// 准备修复后的数据
const fixedData = {
  tools: fixedTools
};

// 写入修复后的数据
try {
  fs.writeFileSync(outputPath, JSON.stringify(fixedData, null, 2), 'utf8');
  console.log(`成功修复工具数据并保存到: ${outputPath}`);
} catch (error) {
  console.error('写入修复后的数据失败:', error.message);
  process.exit(1);
}

console.log('工具修复完成!');
console.log(`总共修复 ${fixedTools.length} 个工具`); 