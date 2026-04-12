#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

type ToolRecord = {
  id: string;
};

type TutorialRecord = {
  id: string;
  title: string;
  relatedTools?: string[];
};

function main() {
  const toolsPath = join(process.cwd(), 'src/data/tools.json');
  const tutorialsPath = join(process.cwd(), 'src/data/tutorials.json');

  const toolsJson = JSON.parse(readFileSync(toolsPath, 'utf-8')) as { tools: ToolRecord[] };
  const tutorialsJson = JSON.parse(readFileSync(tutorialsPath, 'utf-8')) as { tutorials: TutorialRecord[] };

  const toolIds = new Set((toolsJson.tools || []).map((tool) => tool.id));
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const tutorial of tutorialsJson.tutorials || []) {
    const relatedTools = Array.isArray(tutorial.relatedTools) ? tutorial.relatedTools : [];
    const seen = new Set<string>();

    for (const toolId of relatedTools) {
      if (!toolIds.has(toolId)) {
        errors.push(`tutorial ${tutorial.id} references missing tool id: ${toolId}`);
      }
      if (seen.has(toolId)) {
        warnings.push(`tutorial ${tutorial.id} contains duplicate relatedTools entry: ${toolId}`);
      }
      seen.add(toolId);
    }
  }

  console.log('🔍 开始验证教程-工具关联...\n');
  console.log(`✅ 工具总数: ${toolIds.size}`);
  console.log(`✅ 教程总数: ${(tutorialsJson.tutorials || []).length}`);
  console.log(`❌ 失效关联: ${errors.length}`);
  console.log(`⚠️  重复关联: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.log('❌ 失效关联详情:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  重复关联详情:');
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
    console.log('');
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  console.log('✅ 教程-工具关联校验通过');
}

main();
