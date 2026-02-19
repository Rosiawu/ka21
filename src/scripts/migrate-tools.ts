
import fs from 'fs';
import path from 'path';

const toolsPath = path.join(process.cwd(), 'src/data/tools.json');
const rawData = fs.readFileSync(toolsPath, 'utf-8');
const data = JSON.parse(rawData);

// 定义映射关系
const categoryMapping: Record<string, string> = {
  // ✍️ 写文案 (writing)
  'writing': 'writing',
  'chat': 'writing',
  'agent': 'writing',

  // 🎨 做设计 (image)
  'image': 'image',
  'design': 'image',

  // 🎬 剪视频 (video)
  'video': 'video',

  // 🎧 听声音 (audio)
  'audio': 'audio',
  'podcast': 'audio',

  // 💼 办办公 (office)
  'office': 'office',

  // 🔧 小工具 (utils)
  'utils': 'utils',
  'misc': 'utils',
  'coding': 'utils',       // 将编程类并入小工具
  'dev-platform': 'utils'  // 将开发平台并入小工具
};

let updatedCount = 0;

// 遍历并更新工具分类
data.tools = data.tools.map((tool: any) => {
  const oldCategory = tool.toolCategory;
  if (oldCategory && categoryMapping[oldCategory]) {
    const newCategory = categoryMapping[oldCategory];
    if (oldCategory !== newCategory) {
      console.log(`[${tool.name}] ${oldCategory} -> ${newCategory}`);
      updatedCount++;
    }
    return {
      ...tool,
      toolCategory: newCategory
    };
  }
  return tool;
});

// 写入文件
fs.writeFileSync(toolsPath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`\n🎉 迁移完成！共更新了 ${updatedCount} 个工具的分类。`);
