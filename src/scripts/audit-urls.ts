
import fs from 'fs';
import path from 'path';

const toolsPath = path.join(process.cwd(), 'src/data/tools.json');
const fileContent = JSON.parse(fs.readFileSync(toolsPath, 'utf-8'));
const tools = fileContent.tools || fileContent;

// Sort by displayOrder
tools.sort((a: any, b: any) => (a.displayOrder || 999) - (b.displayOrder || 999));

// Print top 30 tools and their URLs
console.log('--- Top 30 Tools URL Audit ---');
tools.slice(0, 30).forEach((t: any) => {
    console.log(`${t.name} (${t.id}): ${t.url}`);
});
