/**
 * 图标格式转换脚本
 * 
 * 本脚本用于将工具数据中的icon字段转换为icons对象结构
 * 
 * 使用方法:
 * 1. 将本脚本放在项目根目录的scripts文件夹中
 * 2. 确保已安装依赖: npm install fs path
 * 3. 运行脚本: node scripts/convert-icons.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// 工具数据文件路径
const TOOLS_DATA_PATH = path.join(__dirname, '../src/data/tools.json');

// 转换icon字段为icons对象结构
function convertIconsFormat() {
  console.log('开始转换图标格式...');

  // 读取工具数据
  let toolsData;
  try {
    const data = fs.readFileSync(TOOLS_DATA_PATH, 'utf8');
    toolsData = JSON.parse(data);
  } catch (error) {
    console.error('读取工具数据失败:', error);
    process.exit(1);
  }

  // 记录转换信息
  let convertedCount = 0;
  let skippedCount = 0;

  // 转换每个工具的图标
  toolsData.tools = toolsData.tools.map(tool => {
    // 如果工具已经有icons字段且没有icon字段，则跳过
    if (tool.icons && !tool.icon) {
      skippedCount++;
      return tool;
    }

    // 如果工具没有icon字段，则跳过
    if (!tool.icon) {
      skippedCount++;
      return tool;
    }

    // 获取图标文件扩展名
    const iconExt = path.extname(tool.icon).toLowerCase();
    
    // 创建icons对象结构
    tool.icons = {};
    
    // 根据文件扩展名设置对应的格式
    if (iconExt === '.svg') {
      tool.icons.svg = tool.icon;
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(iconExt)) {
      tool.icons.png = tool.icon;
    } else {
      // 如果无法确定格式，默认设置为png
      console.warn(`无法确定工具 "${tool.name}" 的图标格式，默认设置为png`);
      tool.icons.png = tool.icon;
    }

    // 保留原有icon字段以保持向后兼容性
    // 注释以下行可以移除icon字段
    // delete tool.icon;

    convertedCount++;
    return tool;
  });

  // 将转换后的数据写回文件
  try {
    fs.writeFileSync(
      TOOLS_DATA_PATH, 
      JSON.stringify(toolsData, null, 2), 
      'utf8'
    );
    console.log(`转换完成! 转换: ${convertedCount} 个, 跳过: ${skippedCount} 个`);
  } catch (error) {
    console.error('写入工具数据失败:', error);
    process.exit(1);
  }
}

// 创建备份
function createBackup() {
  try {
    const data = fs.readFileSync(TOOLS_DATA_PATH, 'utf8');
    const backupPath = `${TOOLS_DATA_PATH}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, data, 'utf8');
    console.log(`已创建备份: ${backupPath}`);
  } catch (error) {
    console.error('创建备份失败:', error);
    process.exit(1);
  }
}

// 主函数
function main() {
  // 检查工具数据文件是否存在
  if (!fs.existsSync(TOOLS_DATA_PATH)) {
    console.error(`工具数据文件不存在: ${TOOLS_DATA_PATH}`);
    process.exit(1);
  }

  // 创建备份
  createBackup();

  // 转换图标格式
  convertIconsFormat();
}

// 运行主函数
main(); 