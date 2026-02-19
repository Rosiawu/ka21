
import fs from 'fs';
import path from 'path';

// Define the path to tools.json
const toolsPath = path.join(process.cwd(), 'src/data/tools.json');

// Read the file
const fileContent = JSON.parse(fs.readFileSync(toolsPath, 'utf-8'));
const tools = fileContent.tools || fileContent;

// --- Part 1: Delete pi.ai ---
const piAiIds = ['pi-ai', 'pi']; // Possible IDs
const initialLength = tools.length;
const newTools = tools.filter((t: any) => !piAiIds.includes(t.id) && t.name !== 'Pi AI');

if (newTools.length < initialLength) {
    console.log(`Deleted ${initialLength - newTools.length} tool(s) (pi.ai)`);
} else {
    console.log('pi.ai not found, skipping deletion.');
}

// --- Part 2: Add Anygen ---
const anygenId = 'anygen';
const existingAnygen = newTools.find((t: any) => t.id === anygenId);

if (!existingAnygen) {
    const anygen = {
        id: "anygen",
        name: "AnyGen",
        description: "AnyGen是一个超越简单生成的AI协作工作区，帮助用户与AI共同塑造、完善和润色内容。它集成了AI写作助手、文档生成器、演示文稿制作和数据分析功能，通过结构化提问引导用户意图，适合个人和团队提升生产力。支持从文档一键生成幻灯片，以及基于数据的即时图表生成。",
        icon: "/icons/anygen.png",
        url: "https://www.anygen.io/",
        tags: ["ai-image", "productivity", "presentation", "writing"],
        recommendLevel: "medium",
        accessibility: "直接访问",
        toolCategory: "image", // User requested "做设计" (Design/Image) category
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        guides: [
             {
                title: "主要功能",
                content: "1. 智能文档转换：将文档快速转换为可编辑的演示文稿\n2. AI写作协作：不仅仅是生成，更是共同打磨内容\n3. 数据可视化：输入数据即时生成图表\n4. 结构化引导：通过提问明确用户意图，避免盲目生成",
                type: "text"
            }
        ]
    };
    newTools.push(anygen);
    console.log('Added AnyGen');
} else {
    console.log('AnyGen already exists, skipping addition.');
}

// --- Part 3: Sort by Popularity (Fame) ---
// Define a hierarchy of fame. Lower number = Higher fame.
// This list is based on general industry knowledge of "Most Famous/Best".
const fameRank: Record<string, number> = {
    // Writing / Chat
    'chatgpt': 1,
    'claude': 2,
    'deepseek': 3,
    'kimi': 4, // Kimi Chat
    'doubao': 5, // Doubao
    'wenxin': 6, // Wenxin Yiyan
    'gemini': 7,
    'monica': 8,
    'poe': 9,
    
    // Image
    'midjourney': 1,
    'stable-diffusion': 2,
    'flux': 3,
    'dall-e': 4,
    'liblib': 5, // LiblibAI
    'civita': 6, // Civitai
    'comfyui': 7,
    'leonardo': 8,
    'ideogram': 9,
    'recraft': 10,
    'anygen': 11,

    // Video
    'runway': 1,
    'pika': 2,
    'luma': 3,
    'sora': 4,
    'kling': 5, // Kling AI (Kuaishou)
    'jimeng': 6, // Jimeng (ByteDance)
    'hailuo': 7, // Hailuo AI
    'viggle': 8,

    // Audio
    'suno': 1,
    'udio': 2,
    'elevenlabs': 3,
    
    // Coding
    'cursor': 1,
    'copilot': 2,
    'windsurf': 3,
    'devin': 4,
    'tongyi-lingma': 5,

    // Office / PPT
    'gamma': 1,
    'microsoft-copilot': 2,
    'notion-ai': 3,
};

// Assign displayOrder based on rank
// If not in rank list, assign a high number (low priority) based on recommendLevel
newTools.forEach((tool: any) => {
    let rank = 999;
    
    // Check exact ID match
    if (fameRank[tool.id]) {
        rank = fameRank[tool.id];
    } else {
        // Check partial name match for some big ones if ID is different
        const lowerName = tool.name.toLowerCase();
        if (lowerName.includes('chatgpt')) rank = 1;
        else if (lowerName.includes('claude')) rank = 2;
        else if (lowerName.includes('midjourney')) rank = 1;
        else if (lowerName.includes('stable diffusion')) rank = 2;
    }

    // Adjust rank slightly by recommendLevel for unranked items
    if (rank === 999) {
        if (tool.recommendLevel === 'high') rank = 100;
        else if (tool.recommendLevel === 'medium') rank = 200;
        else rank = 300;
    }

    tool.displayOrder = rank;
});

// Sort the array by displayOrder
newTools.sort((a: any, b: any) => {
    return (a.displayOrder || 999) - (b.displayOrder || 999);
});

console.log('Sorted tools by fame/popularity.');

// Write back
const output = Array.isArray(fileContent) ? newTools : { ...fileContent, tools: newTools };
fs.writeFileSync(toolsPath, JSON.stringify(output, null, 2));
console.log('Updated tools.json successfully.');
