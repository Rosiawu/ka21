const toolsData = require('../data/tools.js');
const tutorialsData = require('../data/tutorials.js');
const categoriesData = require('../data/categories.js');
const teamData = require('../data/team-members.js');
const ASSET_BASE_URL = 'https://ka21.tools';
const BUNDLED_ICON_FILES = {
  'chatglm.png': true,
  'chatgpt.png': true,
  'claude.png': true,
  'codex.png': true,
  'cursor.png': true,
  'doubao.png': true,
  'elevenlabs-cn.png': true,
  'feishu-base.png': true,
  'gemini.png': true,
  'haimian.png': true,
  'hailuo.svg': true,
  'ideogram.png': true,
  'jm.png': true,
  'kling-ai.png': true,
  'klingai.png': true,
  'listenhub.png': true,
  'lovart.png': true,
  'midjourney.png': true,
  'minimax-audio.png': true,
  'mureka.png': true,
  'music-hero.png': true,
  'notebooklm.png': true,
  'recraft.png': true,
  'remove-bg.png': true,
  'runway.png': true,
  'seko.png': true,
  'suno.png': true,
  'tongyi-efficiency.png': true,
  'trae.png': true,
  'ttsmaker.svg': true,
  'tunee.png': true,
  'veo.svg': true,
  'vidu.png': true,
  'wenxinlyrics.png': true,
  'youdao-fm.png': true,
  'suno.jpg': true,
  'haimian.jpg': true,
  'listenhub.jpg': true,
  'youdao-fm.jpg': true,
  'mureka.jpg': true,
  'tunee.jpg': true,
  'wenxinlyrics.jpg': true,
  'music-hero.jpg': true,
};

const ICON_FILE_ALIAS = {
  'suno.png': 'suno.jpg',
  'haimian.png': 'haimian.jpg',
  'listenhub.png': 'listenhub.jpg',
  'youdao-fm.png': 'youdao-fm.jpg',
  'mureka.png': 'mureka.jpg',
  'tunee.png': 'tunee.jpg',
  'wenxinlyrics.png': 'wenxinlyrics.jpg',
  'music-hero.png': 'music-hero.jpg',
};

function resolveLocalIconPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') {
    return '';
  }

  if (rawPath.startsWith('/public/')) {
    return rawPath;
  }
  if (rawPath.startsWith('public/')) {
    return '/' + rawPath;
  }

  return '';
}

function resolveAssetPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') {
    return '';
  }
  var normalized = rawPath.trim();
  if (normalized.indexOf('http://') === 0 || normalized.indexOf('https://') === 0) {
    var match = normalized.match(/\/icons\/([^/?#]+)$/);
    if (match && match[1] && BUNDLED_ICON_FILES[match[1]]) {
      var aliased = ICON_FILE_ALIAS[match[1]] || match[1];
      return '/icons/' + aliased;
    }
  }
  if (normalized.indexOf('/icons/') === 0 || normalized.indexOf('icons/') === 0) {
    var filename = normalized.split('/').pop();
    if (filename && BUNDLED_ICON_FILES[filename]) {
      var aliasFilename = ICON_FILE_ALIAS[filename] || filename;
      return '/icons/' + aliasFilename;
    }
  }

  const localIconPath = resolveLocalIconPath(rawPath);
  if (localIconPath) {
    return localIconPath;
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  if (normalized.startsWith('/')) {
    return `${ASSET_BASE_URL}${normalized}`;
  }
  return `${ASSET_BASE_URL}/${normalized}`;
}

function safeText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeTool(tool) {
  const iconPath = tool.icon || '';
  return Object.assign({}, tool, {
    icon: resolveAssetPath(iconPath),
    name: safeText(tool.name),
    description: safeText(tool.description),
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    guides: Array.isArray(tool.guides) ? tool.guides : [],
    relatedTutorials: Array.isArray(tool.relatedTutorials) ? tool.relatedTutorials : [],
    groupComments: Array.isArray(tool.groupComments) ? tool.groupComments : [],
  });
}

function normalizeTutorial(tutorial) {
  return Object.assign({}, tutorial, {
    title: safeText(tutorial.title),
    author: safeText(tutorial.author),
    recommendReason: safeText(tutorial.recommendReason),
    imageUrl: resolveAssetPath(tutorial.imageUrl),
    skillTags: Array.isArray(tutorial.skillTags) ? tutorial.skillTags : [],
    relatedTools: Array.isArray(tutorial.relatedTools) ? tutorial.relatedTools : [],
  });
}

function normalizeCategory(category) {
  return Object.assign({}, category, {
    icon: resolveAssetPath(category.icon),
  });
}

function normalizeMember(member) {
  return Object.assign({}, member, {
    avatar: resolveAssetPath(member.avatar),
    wechatQR: resolveAssetPath(member.wechatQR),
    skills: Array.isArray(member.skills) ? member.skills : [],
    aiTools: Array.isArray(member.aiTools) ? member.aiTools : [],
  });
}

const tools = (toolsData.tools || []).map(normalizeTool);
const tutorials = (tutorialsData.tutorials || []).map(normalizeTutorial);
const categories = (categoriesData.categories || []).map(normalizeCategory);
const teamMembers = (teamData.teamMembers || []).map(normalizeMember);

const toolById = {};
tools.forEach((tool) => {
  toolById[tool.id] = tool;
});

const tutorialById = {};
tutorials.forEach((tutorial) => {
  tutorialById[tutorial.id] = tutorial;
});

function getTools() {
  return tools;
}

function getToolById(id) {
  return toolById[id] || null;
}

function getTutorials() {
  return tutorials;
}

function getTutorialById(id) {
  return tutorialById[id] || null;
}

function getCategories() {
  return categories;
}

function getTeamMembers() {
  return teamMembers;
}

function getCategoryLabel(categoryId) {
  const match = categories.find((item) => item.id === categoryId);
  return match ? match.name : '未分类';
}

function searchTools(keyword, categoryId) {
  const lowerKeyword = safeText(keyword).trim().toLowerCase();
  return tools.filter((tool) => {
    const categoryOk = !categoryId || categoryId === 'all' || tool.toolCategory === categoryId;
    if (!categoryOk) return false;
    if (!lowerKeyword) return true;

    const stack = [
      tool.name,
      tool.description,
      (tool.tags || []).join(' '),
      tool.toolCategory || '',
    ]
      .join(' ')
      .toLowerCase();
    return stack.includes(lowerKeyword);
  });
}

function searchTutorials(keyword, category, difficulty) {
  const lowerKeyword = safeText(keyword).trim().toLowerCase();
  return tutorials.filter((tutorial) => {
    const categoryOk = !category || category === 'all' || tutorial.category === category;
    const difficultyOk = !difficulty || difficulty === 'all' || tutorial.difficultyLevel === difficulty;
    if (!categoryOk || !difficultyOk) {
      return false;
    }
    if (!lowerKeyword) return true;
    const stack = [
      tutorial.title,
      tutorial.author,
      tutorial.recommendReason,
      tutorial.category,
      (tutorial.skillTags || []).join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return stack.includes(lowerKeyword);
  });
}

module.exports = {
  resolveAssetPath,
  getTools,
  getToolById,
  getTutorials,
  getTutorialById,
  getCategories,
  getTeamMembers,
  getCategoryLabel,
  searchTools,
  searchTutorials,
};
