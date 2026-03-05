const INTENT_LIBRARY = [
  {
    id: 'voice_video',
    label: '口播视频',
    query: '视频',
    businessTerms: ['口播视频', '配音视频', '解说视频', '数字人口播', '口播剪辑'],
    colloquial: ['搞视频', '做视频', '整视频', '弄视频', '搞个视频', '做个视频'],
    seedTerms: ['口播', '配音', '字幕', '视频剪辑', '短视频', '数字人', '脚本'],
    nouns: ['视频', '口播', '配音', '字幕'],
  },
  {
    id: 'video',
    label: '视频制作',
    query: '视频',
    businessTerms: ['短视频制作', '视频制作', '视频剪辑', 'AI视频'],
    colloquial: ['拍视频', '剪视频', '做短片', '搞短片'],
    seedTerms: ['视频', '剪辑', '转场', '字幕', '配乐', '动画', 'vlog'],
    nouns: ['视频', '短片', '剪辑', '字幕'],
  },
  {
    id: 'poster',
    label: '海报设计',
    query: '海报',
    businessTerms: ['海报设计', '封面设计', '宣传图设计', '图文排版'],
    colloquial: ['搞个海报', '做海报', '整张图', '修个图'],
    seedTerms: ['海报', '封面', '设计', '修图', '抠图', '图片', '排版'],
    nouns: ['海报', '封面', '图片', '设计'],
  },
  {
    id: 'coding',
    label: 'AI编程',
    query: '编程',
    businessTerms: ['AI编程', '代码生成', '代码调试', '前端开发', '后端开发'],
    colloquial: ['写代码', '改代码', '查bug', '修bug', '搞开发'],
    seedTerms: ['编程', '代码', '开发', '调试', '脚本', '前端', '后端'],
    nouns: ['代码', '编程', '开发', 'bug'],
  },
  {
    id: 'writing',
    label: '内容写作',
    query: '写作',
    businessTerms: ['内容写作', '公众号写作', '文案创作', '文章润色'],
    colloquial: ['写篇文章', '改文案', '润色一下', '搞个总结'],
    seedTerms: ['写作', '文案', '文章', '总结', '改写', '润色', '翻译', '报告'],
    nouns: ['写作', '文章', '文案', '总结'],
  },
];

const ACTION_VERBS = ['搞', '做', '整', '弄', '拍', '剪', '写', '改', '修', '来个', '搞个', '做个'];
const INTENT_TOP_TOOL_IDS = {
  voice_video: ['jm-video', 'kling-ai', 'veo', 'hailuo', 'seko', 'chatglm', 'minimax-audio', 'elevenlabs-cn'],
  video: ['jm-video', 'kling-ai', 'veo', 'hailuo', 'seko', 'chatglm', 'vidu', 'runway'],
  poster: ['lovart', 'jm', 'midjourney', 'ideogram', 'recraft', 'klingai', 'remove-bg'],
  coding: ['codex', 'cursor', 'trae', 'chatgpt', 'claude', 'gemini'],
  writing: ['chatgpt', 'claude', 'gemini', 'tongyi-efficiency', 'notebooklm', 'doubao'],
};

const INTENT_CATEGORY_BOOST = {
  voice_video: { video: 30, audio: 24, writing: 10, utils: 8 },
  video: { video: 30, audio: 15, image: 8, utils: 6 },
  poster: { image: 30, utils: 15, office: 8 },
  coding: { coding: 32, writing: 10, utils: 8 },
  writing: { writing: 30, office: 15, utils: 10 },
};

const HOME_REMAINING_PRIORITY_IDS = [
  'claude',
  'gemini',
  'cursor',
  'trae',
  'deepseek',
  'doubao',
  'tongyi-efficiency',
  'notebooklm',
  'kling-ai',
  'jm-video',
  'veo',
  'runway',
  'vidu',
  'seko',
  'hailuo',
  'midjourney',
  'ideogram',
  'recraft',
  'coze',
  'ima',
];

const HOME_CATEGORY_SCORE = {
  coding: 36,
  office: 34,
  writing: 30,
  image: 26,
  video: 24,
  audio: 20,
  utils: 16,
};

function encode(value) {
  return encodeURIComponent(value || '');
}

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/\s+/g, '').trim();
}

function includesAny(text, terms) {
  for (var i = 0; i < terms.length; i += 1) {
    if (text.indexOf(terms[i]) !== -1) {
      return true;
    }
  }
  return false;
}

function dedupeTerms(terms) {
  var map = {};
  var result = [];
  for (var i = 0; i < terms.length; i += 1) {
    var term = normalizeText(terms[i]);
    if (!term || map[term]) continue;
    map[term] = true;
    result.push(term);
  }
  return result;
}

function simplifyOralText(text) {
  return text.replace(/我想要?|想要|我要|我想|帮我|给我|一下|下|可以吗|吧|呢|怎么|如何|想/g, '');
}

function matchTermScore(text, terms, baseScore) {
  var score = 0;
  for (var i = 0; i < terms.length; i += 1) {
    var term = normalizeText(terms[i]);
    if (!term) continue;
    if (text.indexOf(term) === -1) continue;
    var lengthBonus = term.length >= 4 ? 2 : 1;
    score += baseScore + lengthBonus;
  }
  return score;
}

function hasVerbNounPattern(text, nouns) {
  if (!text || !nouns || !nouns.length) return false;
  var verbHit = false;
  for (var i = 0; i < ACTION_VERBS.length; i += 1) {
    if (text.indexOf(ACTION_VERBS[i]) !== -1) {
      verbHit = true;
      break;
    }
  }
  if (!verbHit) return false;

  for (var j = 0; j < nouns.length; j += 1) {
    var noun = normalizeText(nouns[j]);
    if (noun && text.indexOf(noun) !== -1) {
      return true;
    }
  }
  return false;
}

function scoreTextByTerms(text, primaryTerms, secondaryTerms) {
  var score = 0;
  score += matchTermScore(text, primaryTerms || [], 5);
  score += matchTermScore(text, secondaryTerms || [], 2);
  return score;
}

function getRecommendLevelScore(level) {
  if (level === 'high') return 22;
  if (level === 'medium') return 12;
  return 0;
}

function buildTopIdScoreMap(topIds) {
  var map = {};
  for (var i = 0; i < topIds.length; i += 1) {
    map[topIds[i]] = 200 - i * 16;
  }
  return map;
}

function toPlainCategoryLabel(label) {
  if (!label) return '';
  return String(label)
    .replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '')
    .trim();
}

function getIconText(name) {
  var safeName = (name || '').trim();
  if (!safeName) return 'AI';
  return safeName.slice(0, 1).toUpperCase();
}

function clearIconInList(list, id) {
  var next = (list || []).slice();
  for (var i = 0; i < next.length; i += 1) {
    if (next[i].id === id) {
      next[i] = Object.assign({}, next[i], { icon: '' });
      break;
    }
  }
  return next;
}

function getHomeBaseScore(tool, priorityMap) {
  var score = 0;
  if (priorityMap[tool.id] !== undefined) {
    score += 220 - priorityMap[tool.id] * 8;
  }

  if (tool.recommendLevel === 'high') score += 70;
  else if (tool.recommendLevel === 'medium') score += 40;
  else score += 10;

  if (tool.accessibility === '直接访问') score += 20;

  score += HOME_CATEGORY_SCORE[tool.toolCategory] || 8;
  return score;
}

function sortToolsForHome(tools, featuredOrderMap, priorityMap) {
  var list = (tools || []).slice();
  list.sort(function (a, b) {
    var aFeatured = featuredOrderMap[a.id];
    var bFeatured = featuredOrderMap[b.id];
    var aInFeatured = typeof aFeatured === 'number';
    var bInFeatured = typeof bFeatured === 'number';

    if (aInFeatured && bInFeatured) return aFeatured - bFeatured;
    if (aInFeatured) return -1;
    if (bInFeatured) return 1;

    var aPriority = priorityMap[a.id];
    var bPriority = priorityMap[b.id];
    var aHasPriority = typeof aPriority === 'number';
    var bHasPriority = typeof bPriority === 'number';
    if (aHasPriority && bHasPriority) return aPriority - bPriority;
    if (aHasPriority) return -1;
    if (bHasPriority) return 1;

    var scoreDiff = getHomeBaseScore(b, priorityMap) - getHomeBaseScore(a, priorityMap);
    if (scoreDiff !== 0) return scoreDiff;

    var orderDiff = (a.displayOrder || 9999) - (b.displayOrder || 9999);
    if (orderDiff !== 0) return orderDiff;

    return (a.name || '').localeCompare(b.name || '');
  });
  return list;
}

Page({
  data: {
    keyword: '',
    intentLabel: '',
    intentReply: '',
    intentTools: [],
    intentTutorials: [],
    intentQuery: '',
    hasIntentResult: false,
    stats: {
      toolCount: 0,
      tutorialCount: 0,
      categoryCount: 0,
    },
    categories: [],
    hotTools: [],
    latestTutorials: [],
    loadError: '',
  },

  onLoad() {
    try {
      const content = require('../../utils/content');
      const syncStore = require('../../utils/sync-data');
      this._content = content;
      const snapshot = syncStore.getData();
      const tools = content.getTools();
      const tutorials = content.getTutorials();
      const categories = content.getCategories();
      var weeklyPicksData = snapshot.weeklyPicks || {};
      var weeklyMap = {};
      var featuredOrderMap = {};
      var remainingPriorityMap = {};
      var weeklyToolIds = Array.isArray(weeklyPicksData.toolIds) ? weeklyPicksData.toolIds : [];
      for (var i = 0; i < weeklyToolIds.length; i += 1) {
        weeklyMap[weeklyToolIds[i]] = 10;
        featuredOrderMap[weeklyToolIds[i]] = i;
      }
      for (var j = 0; j < HOME_REMAINING_PRIORITY_IDS.length; j += 1) {
        remainingPriorityMap[HOME_REMAINING_PRIORITY_IDS[j]] = j;
      }
      this._weeklyPickMap = weeklyMap;
      const sortedTools = sortToolsForHome(tools, featuredOrderMap, remainingPriorityMap);
      this._allTools = sortedTools;
      this._allTutorials = tutorials;

      const hotTools = sortedTools.slice(0, 8).map(function (tool) {
        return Object.assign({}, tool, {
          categoryLabel: content.getCategoryLabel(tool.toolCategory),
          iconText: getIconText(tool.name),
        });
      });
      const latestTutorials = tutorials.slice(0, 6);

      this.setData({
        stats: {
          toolCount: tools.length,
          tutorialCount: tutorials.length,
          categoryCount: categories.length,
        },
        categories: categories,
        hotTools: hotTools,
        latestTutorials: latestTutorials,
        loadError: '',
      });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      console.error('home onLoad failed:', error);
      this.setData({ loadError: message });
      wx.showToast({
        title: '首页数据加载失败',
        icon: 'none',
      });
    }

    this.syncLatestData();
  },

  syncLatestData: function () {
    var self = this;
    try {
      var syncStore = require('../../utils/sync-data');
      syncStore.syncRemote({
        force: false,
        success: function (result) {
          if (result && result.changed) {
            self.onLoad();
          }
        },
      });
    } catch (error) {
      console.warn('home syncLatestData failed:', error);
    }
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  onSearchConfirm() {
    this.runIntentMatch(this.data.keyword);
  },

  onTapCategory(event) {
    const categoryId = event.currentTarget.dataset.id;
    if (!categoryId) return;
    wx.setStorageSync('home_intent_tools_category', categoryId);
    wx.switchTab({ url: '/pages/tools/index' });
  },

  onTapTool(event) {
    const toolId = event.currentTarget.dataset.id;
    if (!toolId) return;
    wx.navigateTo({
      url: '/pages/tool-detail/index?id=' + encodeURIComponent(toolId),
    });
  },

  onTapTutorial(event) {
    const tutorialId = event.currentTarget.dataset.id;
    if (!tutorialId) return;
    wx.navigateTo({
      url: '/pkg-tutorial/pages/tutorial-detail/index?id=' + encode(tutorialId),
    });
  },

  onQuickSearch(event) {
    const keyword = event.currentTarget.dataset.keyword || '';
    this.setData({ keyword: keyword });
    this.runIntentMatch(keyword);
  },

  detectIntent(input) {
    var normalized = normalizeText(input);
    var simplified = simplifyOralText(normalized);
    var variants = dedupeTerms([normalized, simplified]);
    var bestIntent = null;
    var bestScore = 0;

    for (var i = 0; i < INTENT_LIBRARY.length; i += 1) {
      var intent = INTENT_LIBRARY[i];
      var intentScore = 0;
      for (var v = 0; v < variants.length; v += 1) {
        var text = variants[v];
        intentScore += matchTermScore(text, intent.businessTerms || [], 8);
        intentScore += matchTermScore(text, intent.colloquial || [], 6);
        intentScore += matchTermScore(text, intent.seedTerms || [], 2);
        if (hasVerbNounPattern(text, intent.nouns || [])) {
          intentScore += 4;
        }
      }
      if (intentScore > bestScore) {
        bestScore = intentScore;
        bestIntent = intent;
      }
    }

    return bestScore > 0 ? bestIntent : null;
  },

  buildSearchTerms(input, intent) {
    var primary = [input, simplifyOralText(input)];
    var secondary = [];
    if (intent) {
      primary = primary.concat(intent.businessTerms || []).concat([intent.label]);
      secondary = secondary.concat(intent.seedTerms || []).concat(intent.colloquial || []);
    }

    return {
      primaryTerms: dedupeTerms(primary),
      secondaryTerms: dedupeTerms(secondary),
    };
  },

  findToolsByIntent(termPack) {
    var tools = this._allTools || [];
    var content = this._content;
    var matched = [];
    var intent = termPack.intent || null;
    var topMap = buildTopIdScoreMap(INTENT_TOP_TOOL_IDS[intent ? intent.id : ''] || []);
    var categoryBoostMap = INTENT_CATEGORY_BOOST[intent ? intent.id : ''] || {};
    var weeklyMap = this._weeklyPickMap || {};

    for (var i = 0; i < tools.length; i += 1) {
      var tool = tools[i];
      var stack = normalizeText(
        [
          tool.name || '',
          tool.description || '',
          (tool.tags || []).join(' '),
          tool.toolCategory || '',
        ].join(' ')
      );
      var score = scoreTextByTerms(stack, termPack.primaryTerms, termPack.secondaryTerms);
      score += getRecommendLevelScore(tool.recommendLevel);
      score += topMap[tool.id] || 0;
      score += categoryBoostMap[tool.toolCategory] || 0;
      score += weeklyMap[tool.id] || 0;
      if (score <= 0) continue;
      matched.push(
        Object.assign({}, tool, {
          categoryLabel: content.getCategoryLabel(tool.toolCategory),
          _score: score,
        })
      );
    }

    matched.sort(function (a, b) {
      return b._score - a._score;
    });

    return matched.slice(0, 3).map(function (item) {
      var clone = Object.assign({}, item);
      clone.categoryLabelPlain = toPlainCategoryLabel(clone.categoryLabel);
      clone.iconText = getIconText(clone.name);
      delete clone._score;
      return clone;
    });
  },

  findTutorialsByIntent(termPack) {
    var tutorials = this._allTutorials || [];
    var matched = [];

    for (var i = 0; i < tutorials.length; i += 1) {
      var tutorial = tutorials[i];
      var stack = normalizeText(
        [
          tutorial.title || '',
          tutorial.recommendReason || '',
          tutorial.category || '',
          tutorial.author || '',
          (tutorial.skillTags || []).join(' '),
        ].join(' ')
      );
      var score = scoreTextByTerms(stack, termPack.primaryTerms, termPack.secondaryTerms);
      if (score <= 0) continue;
      matched.push(
        Object.assign({}, tutorial, {
          _score: score,
        })
      );
    }

    matched.sort(function (a, b) {
      return b._score - a._score;
    });

    return matched.slice(0, 3).map(function (item) {
      var clone = Object.assign({}, item);
      delete clone._score;
      return clone;
    });
  },

  runIntentMatch(rawInput) {
    var input = (rawInput || '').trim();
    if (!input) {
      wx.showToast({ title: '请输入你的需求，比如：视频', icon: 'none' });
      return;
    }

    var intent = this.detectIntent(input);
    var termPack = this.buildSearchTerms(input, intent);
    termPack.intent = intent;
    var tools = this.findToolsByIntent(termPack);
    var tutorials = this.findTutorialsByIntent(termPack);
    var label = intent ? intent.label : '关键词';
    var query = intent ? intent.query || intent.label : input;
    var normalizedInput = normalizeText(input);
    var normalizedLabel = intent ? normalizeText(intent.label) : '';
    var intentHint = intent && normalizedInput.indexOf(normalizedLabel) === -1
      ? '已按“' + intent.label + '”理解你的需求。'
      : '';
    var reply = tools.length || tutorials.length
      ? intentHint + '已为你匹配到最相关的工具和教程，先从前三个开始看。'
      : '暂时没找到完全匹配的内容，你可以换个更具体的说法再试。';

    this.setData({
      keyword: input,
      intentLabel: label,
      intentReply: reply,
      intentTools: tools,
      intentTutorials: tutorials,
      intentQuery: query,
      hasIntentResult: true,
    });
  },

  onGoAllTools() {
    var query = this.data.intentQuery || (this.data.keyword || '').trim();
    wx.setStorageSync('home_intent_tools_keyword', query);
    wx.switchTab({ url: '/pages/tools/index' });
  },

  onGoAllTutorials() {
    var query = this.data.intentQuery || (this.data.keyword || '').trim();
    wx.setStorageSync('home_intent_tutorials_keyword', query);
    wx.switchTab({ url: '/pages/tutorials/index' });
  },

  onIntentToolIconError(event) {
    var id = event.currentTarget.dataset.id;
    if (!id) return;
    this.setData({
      intentTools: clearIconInList(this.data.intentTools, id),
    });
  },

  onHotToolIconError(event) {
    var id = event.currentTarget.dataset.id;
    if (!id) return;
    this.setData({
      hotTools: clearIconInList(this.data.hotTools, id),
    });
  },
});
