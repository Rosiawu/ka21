import type { ToolCategoryId } from '@/lib/types';

export type CoreScenarioId =
  | 'content-writing'
  | 'image-design'
  | 'video-creation'
  | 'audio-podcast'
  | 'office-productivity'
  | 'coding-development'
  | 'agent-automation'
  | 'learning-research'
  | 'commerce-marketing'
  | 'data-analysis';

export type UnifiedDifficultyLevel = '小白入门' | '萌新进阶' | '高端玩家';

type Locale = 'zh' | 'en';

type ScenarioDef = {
  label: Record<Locale, string>;
  colorClass: string;
  aliases: string[];
};

export const CORE_SCENARIO_ORDER: CoreScenarioId[] = [
  'office-productivity',
  'content-writing',
  'image-design',
  'video-creation',
  'audio-podcast',
  'coding-development',
  'agent-automation',
  'learning-research',
  'commerce-marketing',
  'data-analysis',
];

export const CORE_SCENARIO_DEFINITIONS: Record<CoreScenarioId, ScenarioDef> = {
  'content-writing': {
    label: { zh: '内容写作', en: 'Content Writing' },
    colorClass: 'bg-emerald-500',
    aliases: ['写作', '文案', '提示词', 'chat', 'writing', 'content'],
  },
  'image-design': {
    label: { zh: '图像设计', en: 'Image Design' },
    colorClass: 'bg-fuchsia-500',
    aliases: ['绘图', '设计', '修图', 'image', 'design', 'visual'],
  },
  'video-creation': {
    label: { zh: '视频创作', en: 'Video Creation' },
    colorClass: 'bg-rose-500',
    aliases: ['视频', '剪辑', '短片', 'video', 'editing'],
  },
  'audio-podcast': {
    label: { zh: '音频播客', en: 'Audio & Podcast' },
    colorClass: 'bg-cyan-500',
    aliases: ['音频', '音乐', '播客', 'speech', 'audio', 'podcast'],
  },
  'office-productivity': {
    label: { zh: '办公提效', en: 'Office Productivity' },
    colorClass: 'bg-blue-500',
    aliases: ['效率', '办公', '文档', 'office', 'productivity'],
  },
  'coding-development': {
    label: { zh: '编程开发', en: 'Coding Development' },
    colorClass: 'bg-indigo-500',
    aliases: ['编程', '代码', '开发', 'coding', 'development'],
  },
  'agent-automation': {
    label: { zh: '智能体自动化', en: 'Agents Automation' },
    colorClass: 'bg-violet-500',
    aliases: ['智能体', '工作流', '自动化', 'agent', 'automation'],
  },
  'learning-research': {
    label: { zh: '学习研究', en: 'Learning Research' },
    colorClass: 'bg-amber-500',
    aliases: ['学习', '研究', '知识库', 'research', 'learning'],
  },
  'commerce-marketing': {
    label: { zh: '电商营销', en: 'Commerce Marketing' },
    colorClass: 'bg-orange-500',
    aliases: ['电商', '营销', 'commerce', 'marketing'],
  },
  'data-analysis': {
    label: { zh: '数据分析', en: 'Data Analysis' },
    colorClass: 'bg-teal-500',
    aliases: ['数据', '分析', 'data', 'analytics'],
  },
};

export const TOOL_CATEGORY_TO_CORE_SCENARIO: Record<ToolCategoryId, CoreScenarioId> = {
  writing: 'content-writing',
  image: 'image-design',
  video: 'video-creation',
  audio: 'audio-podcast',
  office: 'office-productivity',
  coding: 'coding-development',
  utils: 'office-productivity',
};

export const TOOL_TAG_TO_CORE_SCENARIO: Record<string, CoreScenarioId> = {
  academic: 'learning-research',
  'ai-agent': 'agent-automation',
  'ai-api': 'agent-automation',
  'ai-art': 'image-design',
  'ai-assistant': 'office-productivity',
  'ai-audio': 'audio-podcast',
  'ai-chat': 'content-writing',
  'ai-code': 'coding-development',
  'ai-design': 'image-design',
  'ai-detection': 'learning-research',
  'ai-image': 'image-design',
  'ai-podcast': 'audio-podcast',
  'ai-research': 'learning-research',
  'ai-search': 'learning-research',
  'ai-tools': 'office-productivity',
  'ai-video': 'video-creation',
  'ai-writing': 'content-writing',
  'asset-management': 'office-productivity',
  automation: 'agent-automation',
  'background-removal': 'image-design',
  'batch-processing': 'office-productivity',
  'business-intelligence': 'data-analysis',
  'character-generation': 'image-design',
  collaboration: 'office-productivity',
  'content-creation': 'content-writing',
  'content-generation': 'content-writing',
  creativity: 'image-design',
  design: 'image-design',
  development: 'coding-development',
  'document-conversion': 'office-productivity',
  'document-formatting': 'office-productivity',
  email: 'office-productivity',
  'file-conversion': 'office-productivity',
  google: 'learning-research',
  'image-processing': 'image-design',
  'knowledge-base': 'learning-research',
  'media-tools': 'video-creation',
  meeting: 'office-productivity',
  minimax: 'audio-podcast',
  multimodal: 'agent-automation',
  'music-generation': 'audio-podcast',
  'no-code': 'agent-automation',
  office: 'office-productivity',
  'open-source': 'coding-development',
  'pdf-tools': 'office-productivity',
  'photo-editing': 'image-design',
  presentation: 'office-productivity',
  privacy: 'office-productivity',
  productivity: 'office-productivity',
  research: 'learning-research',
  restoration: 'image-design',
  'scene-composition': 'video-creation',
  'speech-to-text': 'audio-podcast',
  'text-to-speech': 'audio-podcast',
  upscaling: 'image-design',
  utility: 'office-productivity',
  'video-creation': 'video-creation',
  'video-editing': 'video-creation',
  'video-generation': 'video-creation',
  'web-design': 'image-design',
  writing: 'content-writing',
};

export const TUTORIAL_CATEGORY_TO_CORE_SCENARIO: Record<string, CoreScenarioId> = {
  AI办公: 'office-productivity',
  AI图像: 'image-design',
  AI大模型: 'content-writing',
  AI播客: 'audio-podcast',
  AI效率: 'office-productivity',
  AI智能体: 'agent-automation',
  AI绘画: 'image-design',
  AI编程: 'coding-development',
  AI视频: 'video-creation',
  AI设计: 'image-design',
  AI通用智能体: 'agent-automation',
  AI音频: 'audio-podcast',
  飞书多维表格: 'office-productivity',
};

export const TUTORIAL_SKILL_TAG_TO_CORE_SCENARIO: Record<string, CoreScenarioId> = {
  '3D建模': 'image-design',
  'AI Logo': 'image-design',
  'AI PPT': 'office-productivity',
  AIGC: 'office-productivity',
  AI动画: 'video-creation',
  AI去水印: 'image-design',
  AI合集: 'office-productivity',
  AI工作台: 'office-productivity',
  AI工作流: 'agent-automation',
  AI播客: 'audio-podcast',
  AI生图: 'image-design',
  AI绘图: 'image-design',
  AI绘图工具: 'image-design',
  AI绘画: 'image-design',
  AI维权: 'learning-research',
  AI编程: 'coding-development',
  AI视频: 'video-creation',
  AI设计: 'image-design',
  AI音乐: 'audio-podcast',
  AI音频: 'audio-podcast',
  ChatGPT: 'content-writing',
  Claude: 'content-writing',
  Coze: 'agent-automation',
  DeepSeek: 'content-writing',
  Dify: 'coding-development',
  Fastgpt: 'coding-development',
  Flowith: 'office-productivity',
  GPT: 'content-writing',
  Gemini: 'content-writing',
  Hatch: 'agent-automation',
  IMA: 'agent-automation',
  IP创作: 'content-writing',
  IP动画: 'video-creation',
  KT板设计: 'image-design',
  Leonardo: 'image-design',
  Liblib: 'image-design',
  LoRA训练: 'image-design',
  Lovart: 'image-design',
  MV制作: 'video-creation',
  P图技巧: 'image-design',
  RAG: 'coding-development',
  Ragflow: 'coding-development',
  Seko: 'agent-automation',
  TTS: 'audio-podcast',
  coze: 'agent-automation',
  ima: 'agent-automation',
  mistral: 'content-writing',
  n8n: 'coding-development',
  上下文工程: 'agent-automation',
  中文语音合成: 'audio-podcast',
  产品设计: 'image-design',
  亲情: 'content-writing',
  人物一致性: 'image-design',
  代码提升: 'coding-development',
  代码生成: 'coding-development',
  低代码应用: 'coding-development',
  使用心得: 'office-productivity',
  保姆级: 'office-productivity',
  保姆级教程: 'office-productivity',
  信息管理: 'office-productivity',
  修复神器: 'image-design',
  入门教程: 'office-productivity',
  全场景覆盖: 'office-productivity',
  内容创作: 'content-writing',
  内容整理: 'office-productivity',
  内测: 'office-productivity',
  分镜设计: 'video-creation',
  剧情短片: 'video-creation',
  办公效率: 'office-productivity',
  功能测评: 'learning-research',
  即梦: 'video-creation',
  即梦Agent: 'agent-automation',
  去水印工具: 'image-design',
  可灵: 'video-creation',
  可编辑性: 'office-productivity',
  商用Agent: 'commerce-marketing',
  国产大模型: 'content-writing',
  图像修复: 'image-design',
  图像生成: 'image-design',
  图像编辑: 'image-design',
  多模态交互: 'agent-automation',
  大模型应用: 'content-writing',
  天工: 'agent-automation',
  学习效率: 'learning-research',
  实战指南: 'office-productivity',
  工作流: 'agent-automation',
  工作流优化: 'agent-automation',
  工作流自动化: 'agent-automation',
  工具对比: 'learning-research',
  工具推荐: 'office-productivity',
  工具盘点: 'learning-research',
  工具选型: 'office-productivity',
  工具链实战: 'agent-automation',
  年终复盘: 'learning-research',
  思维导图: 'office-productivity',
  情感注入: 'content-writing',
  批量创作: 'office-productivity',
  提示词: 'content-writing',
  提示词工程: 'content-writing',
  效率工具: 'office-productivity',
  教学辅助: 'learning-research',
  数字化管理: 'office-productivity',
  数据采集: 'data-analysis',
  智能体: 'agent-automation',
  智能体生成器: 'agent-automation',
  更新盘点: 'learning-research',
  本地部署: 'coding-development',
  案例: 'learning-research',
  沉浸式翻译: 'content-writing',
  法律实战: 'learning-research',
  流程图: 'office-productivity',
  浏览器插件: 'coding-development',
  淘宝比价: 'commerce-marketing',
  电商增效: 'commerce-marketing',
  电商视觉: 'commerce-marketing',
  知识库: 'learning-research',
  编程: 'coding-development',
  自动化: 'agent-automation',
  自动化工作流: 'agent-automation',
  自由画布: 'image-design',
  表情包制作: 'image-design',
  视频Agent: 'agent-automation',
  视频制作: 'video-creation',
  视频处理: 'video-creation',
  视频拆解: 'video-creation',
  设计控制: 'image-design',
  证据整理: 'learning-research',
  评测: 'learning-research',
  豆包: 'content-writing',
  豆包超能创意: 'content-writing',
  重构工作流: 'agent-automation',
  音乐创作: 'audio-podcast',
  音色设计: 'audio-podcast',
  飞书多维表格: 'office-productivity',
};

const normalizeToken = (value: string): string => value.trim().toLowerCase();

const scenarioPriority: Record<CoreScenarioId, number> = CORE_SCENARIO_ORDER.reduce(
  (acc, id, index) => {
    acc[id] = index;
    return acc;
  },
  {} as Record<CoreScenarioId, number>
);

const tutorialSkillMapNormalized = new Map<string, CoreScenarioId>(
  Object.entries(TUTORIAL_SKILL_TAG_TO_CORE_SCENARIO).map(([skill, scenario]) => [
    normalizeToken(skill),
    scenario,
  ])
);

const toolTagMapNormalized = new Map<string, CoreScenarioId>(
  Object.entries(TOOL_TAG_TO_CORE_SCENARIO).map(([tag, scenario]) => [normalizeToken(tag), scenario])
);

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const sortScenarios = (values: CoreScenarioId[]): CoreScenarioId[] =>
  Array.from(new Set(values)).sort((a, b) => scenarioPriority[a] - scenarioPriority[b]);

const getCoreScenarioByKeyword = (rawValue: string): CoreScenarioId | undefined => {
  const value = normalizeToken(rawValue);
  if (!value) return undefined;

  if (/(电商|淘宝|营销|commerce|marketing)/.test(value)) return 'commerce-marketing';
  if (/(数据采集|数据分析|analytics|business-intelligence)/.test(value)) return 'data-analysis';
  if (/(编程|代码|rag|dify|fastgpt|ragflow|n8n|本地部署|插件|development|coding)/.test(value)) {
    return 'coding-development';
  }
  if (/(智能体|agent|工作流|自动化|coze|hatch|ima|seko|上下文工程|automation)/.test(value)) {
    return 'agent-automation';
  }
  if (/(视频|分镜|短片|可灵|即梦|kling|mv|动画|剧情|video)/.test(value)) {
    return 'video-creation';
  }
  if (/(音频|音乐|tts|播客|语音|音色|audio|podcast|speech)/.test(value)) {
    return 'audio-podcast';
  }
  if (/(绘画|绘图|图像|设计|logo|画布|p图|修复|去水印|表情包|3d|视觉|lora|leonardo|lovart|image|design)/.test(value)) {
    return 'image-design';
  }
  if (/(评测|案例|盘点|对比|学习|教学|证据|研究|复盘|法律|research|learning)/.test(value)) {
    return 'learning-research';
  }
  if (/(提示词|内容创作|chatgpt|claude|gpt|gemini|mistral|deepseek|天工|豆包|大模型|写作|翻译|writing|content)/.test(value)) {
    return 'content-writing';
  }

  return undefined;
};

const buildScenarioAliasPool = (): Record<CoreScenarioId, string[]> => {
  const pool = CORE_SCENARIO_ORDER.reduce((acc, scenarioId) => {
    const def = CORE_SCENARIO_DEFINITIONS[scenarioId];
    acc[scenarioId] = [
      scenarioId,
      def.label.zh,
      def.label.en,
      ...def.aliases,
    ];
    return acc;
  }, {} as Record<CoreScenarioId, string[]>);

  const inject = (mapping: Record<string, CoreScenarioId>) => {
    Object.entries(mapping).forEach(([legacy, scenarioId]) => {
      pool[scenarioId].push(legacy);
    });
  };

  inject(TOOL_CATEGORY_TO_CORE_SCENARIO);
  inject(TOOL_TAG_TO_CORE_SCENARIO);
  inject(TUTORIAL_CATEGORY_TO_CORE_SCENARIO);
  inject(TUTORIAL_SKILL_TAG_TO_CORE_SCENARIO);

  CORE_SCENARIO_ORDER.forEach((scenarioId) => {
    pool[scenarioId] = unique(pool[scenarioId]);
  });

  return pool;
};

const scenarioAliasPool = buildScenarioAliasPool();

export function getCoreScenarioIds(): CoreScenarioId[] {
  return [...CORE_SCENARIO_ORDER];
}

export function getCoreScenarioLabel(id: CoreScenarioId, locale: Locale): string {
  return CORE_SCENARIO_DEFINITIONS[id].label[locale];
}

export function getCoreScenarioColorClass(id: CoreScenarioId): string {
  return CORE_SCENARIO_DEFINITIONS[id].colorClass;
}

export function getCoreScenarioAliases(id: CoreScenarioId): string[] {
  return scenarioAliasPool[id];
}

export function localizeUnifiedDifficulty(level: UnifiedDifficultyLevel, locale: Locale): string {
  if (locale === 'zh') return level;
  if (level === '小白入门') return 'Beginner';
  if (level === '萌新进阶') return 'Intermediate';
  return 'Advanced';
}

export function mapToolTagToCoreScenario(tag: string): CoreScenarioId | undefined {
  if (!tag) return undefined;
  const normalized = normalizeToken(tag);
  return toolTagMapNormalized.get(normalized) || getCoreScenarioByKeyword(normalized);
}

export function mapTutorialSkillTagToCoreScenario(skillTag: string): CoreScenarioId | undefined {
  if (!skillTag) return undefined;
  const normalized = normalizeToken(skillTag);
  return tutorialSkillMapNormalized.get(normalized) || getCoreScenarioByKeyword(normalized);
}

export function resolveToolCoreScenarios(tool: {
  toolCategory?: string;
  tags?: string[];
}): CoreScenarioId[] {
  const scenarios: CoreScenarioId[] = [];

  if (tool.toolCategory && tool.toolCategory in TOOL_CATEGORY_TO_CORE_SCENARIO) {
    scenarios.push(TOOL_CATEGORY_TO_CORE_SCENARIO[tool.toolCategory as ToolCategoryId]);
  }

  (tool.tags || []).forEach((tag) => {
    const mapped = mapToolTagToCoreScenario(tag);
    if (mapped) scenarios.push(mapped);
  });

  if (scenarios.length === 0) {
    scenarios.push('office-productivity');
  }

  return sortScenarios(scenarios);
}

export function resolveTutorialCoreScenarios(tutorial: {
  category?: string;
  skillTags?: string[];
}): CoreScenarioId[] {
  const scenarios: CoreScenarioId[] = [];

  if (tutorial.category && tutorial.category in TUTORIAL_CATEGORY_TO_CORE_SCENARIO) {
    scenarios.push(TUTORIAL_CATEGORY_TO_CORE_SCENARIO[tutorial.category]);
  }

  (tutorial.skillTags || []).forEach((skillTag) => {
    const mapped = mapTutorialSkillTagToCoreScenario(skillTag);
    if (mapped) scenarios.push(mapped);
  });

  if (scenarios.length === 0) {
    scenarios.push('office-productivity');
  }

  return sortScenarios(scenarios);
}

export function getPrimaryCoreScenario(scenarios: CoreScenarioId[]): CoreScenarioId {
  return sortScenarios(scenarios)[0] || 'office-productivity';
}

export function getToolHiddenTaxonomyTags(tool: {
  toolCategory?: string;
  tags?: string[];
}): string[] {
  return unique([tool.toolCategory || '', ...(tool.tags || [])]);
}

export function getTutorialHiddenTaxonomyTags(tutorial: {
  category?: string;
  skillTags?: string[];
}): string[] {
  return unique([tutorial.category || '', ...(tutorial.skillTags || [])]);
}

export function getToolSearchAliasTokens(tool: {
  toolCategory?: string;
  tags?: string[];
}): string[] {
  const scenarios = resolveToolCoreScenarios(tool);
  const visibleTokens = scenarios.flatMap((scenario) => getCoreScenarioAliases(scenario));
  const hiddenTokens = getToolHiddenTaxonomyTags(tool);
  return unique([...visibleTokens, ...hiddenTokens]);
}

export function getTutorialSearchAliasTokens(tutorial: {
  category?: string;
  skillTags?: string[];
}): string[] {
  const scenarios = resolveTutorialCoreScenarios(tutorial);
  const visibleTokens = scenarios.flatMap((scenario) => getCoreScenarioAliases(scenario));
  const hiddenTokens = getTutorialHiddenTaxonomyTags(tutorial);
  return unique([...visibleTokens, ...hiddenTokens]);
}

export function matchesTaxonomyToken(query: string, tokens: string[]): boolean {
  const normalizedQuery = normalizeToken(query);
  if (!normalizedQuery) return false;

  return tokens.some((token) => normalizeToken(token).includes(normalizedQuery));
}

const ADVANCED_TAGS = new Set<string>([
  'ai-api',
  'development',
  'open-source',
  'business-intelligence',
  'research',
  'academic',
]);

const INTERMEDIATE_TAGS = new Set<string>([
  'ai-video',
  'video-editing',
  'video-generation',
  'music-generation',
  'multimodal',
  'character-generation',
  'scene-composition',
]);

export function inferToolDifficulty(tool: {
  toolCategory?: string;
  tags?: string[];
}): UnifiedDifficultyLevel {
  const normalizedTags = new Set((tool.tags || []).map((tag) => normalizeToken(tag)));

  if (tool.toolCategory === 'coding') return '高端玩家';
  if (tool.toolCategory === 'video' || tool.toolCategory === 'audio') return '萌新进阶';

  for (const tag of ADVANCED_TAGS) {
    if (normalizedTags.has(tag)) return '高端玩家';
  }

  for (const tag of INTERMEDIATE_TAGS) {
    if (normalizedTags.has(tag)) return '萌新进阶';
  }

  return '小白入门';
}

export function serializeTagsForTelemetry(tags: string[], maxTags = 24): string {
  return unique(tags).slice(0, maxTags).join('|');
}
