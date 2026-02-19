
import fs from 'fs';
import path from 'path';
import { Tool, ToolCategoryId } from '../lib/types';

const toolsPath = path.join(process.cwd(), 'src/data/tools.json');
const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf-8'));
let tools: Tool[] = toolsData.tools;

console.log(`Initial tool count: ${tools.length}`);

// 1. Define lists
const codingToolIds = [
  'trae', 'cursor', 'replit', 'bolt', 'v0', 'mars', 'mars-code', 'marscode', 
  'websim', 'lovable', 'zeabur', 'devv', 'github-copilot', 'windsurf', 'cursor-ai',
  'bolt-new', 'v0-dev'
];

const deleteIds = ['qiyu-ai', 'xunjie-photo', 'qiyu'];
const deleteNames = ['奇域AI', '迅捷智能修复老照片'];

// 2. Process tools
const newTools: Tool[] = [];
const processedIds = new Set<string>();

tools.forEach(tool => {
  // Check for deletion
  if (deleteIds.includes(tool.id) || deleteNames.includes(tool.name)) {
    console.log(`Deleting tool: ${tool.name} (${tool.id})`);
    return;
  }

  // Check for modifications
  if (tool.id === 'lovart') {
    console.log(`Moving lovart to image`);
    tool.toolCategory = 'image';
  } else if (tool.id === 'tiangong') {
    console.log(`Moving tiangong to office`);
    tool.toolCategory = 'office';
  } else if (tool.id === 'seko' || tool.id === 'seko-ai') {
    console.log(`Moving seko to video`);
    tool.toolCategory = 'video';
  } else if (tool.id === 'video-to-article') {
    console.log(`Moving video-to-article to video`);
    tool.toolCategory = 'video';
  } else if (codingToolIds.includes(tool.id)) {
    console.log(`Moving ${tool.name} (${tool.id}) to coding`);
    tool.toolCategory = 'coding';
  } else if (tool.toolCategory === 'utils' || tool.toolCategory === 'office' || tool.toolCategory === 'writing') {
     // Heuristic for other coding tools
     const keywords = ['code', 'programming', 'develop', '编程', '代码', '开发'];
     const combinedText = (tool.description + ' ' + (tool.tags?.join(' ') || '')).toLowerCase();
     if (keywords.some(k => combinedText.includes(k))) {
       // Conservative check: only if it looks very much like a coding tool
       if (tool.tags?.includes('developer-tools') || tool.tags?.includes('coding') || tool.tags?.includes('programming')) {
          console.log(`[Heuristic] Moving ${tool.name} (${tool.id}) to coding`);
          tool.toolCategory = 'coding';
       }
     }
  }

  newTools.push(tool);
  processedIds.add(tool.id);

  // Duplication for Jimeng
  if (tool.id === 'jm' || tool.id === 'jimeng') {
    console.log(`Duplicating ${tool.name} to video category`);
    const videoTool = { ...tool };
    videoTool.id = `${tool.id}-video`;
    // videoTool.name = `${tool.name}`; // Keep same name as requested "重复放入"
    videoTool.toolCategory = 'video';
    
    // Check if ID already exists to avoid double addition if script runs twice (though we are rebuilding list)
    if (!processedIds.has(videoTool.id)) {
        newTools.push(videoTool);
        processedIds.add(videoTool.id);
    }
  }
});

console.log(`Final tool count: ${newTools.length}`);

// 3. Write back
fs.writeFileSync(toolsPath, JSON.stringify({ tools: newTools }, null, 2));
console.log('Done!');
