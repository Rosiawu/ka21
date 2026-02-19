
import fs from 'fs';
import path from 'path';

// Define the path to tools.json
const TOOLS_PATH = path.join(process.cwd(), 'src/data/tools.json');

// Define the priority list for sorting (best/most famous first)
const PRIORITY_TOOLS: Record<string, string[]> = {
  writing: ['chatgpt', 'claude', 'deepseek', 'kimi', 'doubao', 'monica', 'perplexity'],
  image: ['midjourney', 'stable-diffusion', 'flux', 'jm', 'liblib', 'ideogram', 'anygen', 'lovart'],
  video: ['sora', 'kling', 'runway', 'pika', 'jm-video', 'luma', 'seko', 'video-to-article'],
  audio: ['suno', 'udio'],
  office: ['gamma', 'microsoft-copilot', 'notion-ai', 'tiangong'],
  coding: ['cursor', 'trae', 'github-copilot', 'windsurf', 'vscode'],
  utils: ['remove-bg']
};

async function main() {
  // 1. Read existing tools
  const data = JSON.parse(fs.readFileSync(TOOLS_PATH, 'utf-8'));
  let tools = data.tools;
  
  console.log(`Original tool count: ${tools.length}`);

  // 2. Delete 'pi.ai' (id: pi-ai)
  tools = tools.filter((t: any) => t.id !== 'pi-ai');
  console.log(`After deleting pi-ai: ${tools.length}`);

  // 3. Add 'anygen' to 'image' category
  const anygen = {
    id: "anygen",
    name: "AnyGen",
    description: "AnyGen 是一款专业的AI设计与文档生成工具，特别擅长将文档一键转化为高质量的演示文稿（PPT）和视觉设计。它不仅仅是简单的生成，更提供了深度协作编辑功能，支持图表、排版和配色的智能优化。适合需要快速产出专业汇报材料、设计草图和结构化内容的职场人士与设计师。",
    icon: "/icons/anygen.png", // Placeholder, ensure this exists or use a generic one
    url: "https://www.anygen.io/",
    tags: ["ai-design", "presentation", "productivity"],
    recommendLevel: "medium",
    accessibility: "直接访问", // Assumption
    toolCategory: "image", // User requested "做设计"
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVisible: true,
    guides: [
      {
        title: "主要功能",
        content: "1. 文档转PPT：一键将Word/PDF文档转化为设计精美的PPT\n2. 智能排版：自动优化页面布局和配色方案\n3. 协作编辑：支持团队实时协作修改\n4. 数据可视化：自动将数据转化为专业图表",
        type: "text"
      }
    ]
  };
  
  // Check if anygen already exists to avoid duplicates
  if (!tools.find((t: any) => t.id === 'anygen')) {
    tools.push(anygen);
    console.log("Added AnyGen");
  }

  // 4. Update displayOrder based on priority
  tools = tools.map((tool: any) => {
    const category = tool.toolCategory;
    const priorityList = PRIORITY_TOOLS[category];
    
    if (priorityList) {
      // Find index in priority list (case-insensitive ID check or Name check)
      const index = priorityList.findIndex(key => 
        tool.id.toLowerCase().includes(key.toLowerCase()) || 
        tool.name.toLowerCase().includes(key.toLowerCase())
      );
      
      if (index !== -1) {
        // Assign displayOrder: 1, 2, 3...
        // We add category index * 1000 to keep them separated if needed, 
        // but since we sort within categories usually, simple 1-based is fine.
        // However, existing data uses 7000, etc.
        // Let's use small numbers for priority tools (1-100) and keep others undefined (which effectively puts them later or we explicitly set them to 1000+)
        return { ...tool, displayOrder: index + 1 };
      }
    }
    
    // For non-priority tools, set a high order or remove displayOrder to fall back to default sort
    // If we want them sorted "least famous" (last), high number is good.
    return { ...tool, displayOrder: 1000 };
  });

  // 5. Write back
  fs.writeFileSync(TOOLS_PATH, JSON.stringify({ tools }, null, 2));
  console.log("Tools updated and sorted successfully.");
}

main();
