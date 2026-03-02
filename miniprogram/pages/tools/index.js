function encode(value) {
  return encodeURIComponent(value || '');
}

function decode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

function getRecommendMeta(level) {
  if (level === 'high') {
    return { text: '必入', className: 'badge-high' };
  }
  if (level === 'medium') {
    return { text: '推荐', className: 'badge-medium' };
  }
  return { text: '可选', className: 'badge-low' };
}

function getAccessMeta(accessibility) {
  if (accessibility === '直接访问') {
    return { className: 'badge-access-direct' };
  }
  return { className: 'badge-access-proxy' };
}

Page({
  data: {
    keyword: '',
    categoryId: 'all',
    categories: [],
    tools: [],
    activeToolId: '',
    loadError: '',
  },

  onLoad: function (options) {
    this._allTools = [];
    this._categoryMap = {};

    var keyword = decode((options && options.keyword) || '');
    var categoryId = decode((options && options.category) || 'all');
    this.setData({
      keyword: keyword,
      categoryId: categoryId || 'all',
    });

    this.initData();
  },

  onShow: function () {
    var pendingKeyword = wx.getStorageSync('home_intent_tools_keyword');
    var pendingCategory = wx.getStorageSync('home_intent_tools_category');
    if (!pendingKeyword && !pendingCategory) {
      return;
    }
    wx.removeStorageSync('home_intent_tools_keyword');
    wx.removeStorageSync('home_intent_tools_category');
    this.setData({
      keyword: pendingKeyword || '',
      categoryId: pendingCategory || 'all',
    });
    this.applyFilters();
  },

  onUnload: function () {
    if (this._activeTimer) {
      clearTimeout(this._activeTimer);
      this._activeTimer = null;
    }
    if (this._navigateTimer) {
      clearTimeout(this._navigateTimer);
      this._navigateTimer = null;
    }
  },

  initData: function () {
    try {
      var categoriesData = require('../../data/categories.js').categories || [];
      var toolsData = require('../../data/tools.js').tools || [];
      var weeklyPicksData = require('../../data/weekly-picks.js').weeklyPicks || {};
      var contentUtils = require('../../utils/content');

      var categories = [{ id: 'all', name: '全部' }];
      var map = {};
      var i = 0;
      for (i = 0; i < categoriesData.length; i += 1) {
        categories.push(categoriesData[i]);
        map[categoriesData[i].id] = categoriesData[i].name;
      }
      this._categoryMap = map;

      var normalizedTools = [];
      for (i = 0; i < toolsData.length; i += 1) {
        var tool = toolsData[i];
        normalizedTools.push(
          Object.assign({}, tool, {
            icon: contentUtils.resolveAssetPath(tool.icon),
          })
        );
      }
      var featuredToolOrderMap = {};
      var weeklyToolIds = Array.isArray(weeklyPicksData.toolIds) ? weeklyPicksData.toolIds : [];
      for (i = 0; i < weeklyToolIds.length; i += 1) {
        featuredToolOrderMap[weeklyToolIds[i]] = i;
      }

      this._allTools = normalizedTools;
      this._featuredToolOrderMap = featuredToolOrderMap;

      this.setData({
        categories: categories,
        loadError: '',
      });
      this.applyFilters();
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tools initData failed:', error);
      this.setData({ loadError: message, tools: [] });
      wx.showToast({ title: '工具库加载失败', icon: 'none' });
    }
  },

  onKeywordInput: function (event) {
    this.setData({ keyword: event.detail.value });
    this.applyFilters();
  },

  onClearKeyword: function () {
    this.setData({ keyword: '' });
    this.applyFilters();
  },

  onCategoryTap: function (event) {
    var categoryId = event.currentTarget.dataset.id || 'all';
    this.setData({ categoryId: categoryId });
    this.applyFilters();
  },

  onToolTouchStart: function (event) {
    var id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    if (this._activeTimer) {
      clearTimeout(this._activeTimer);
      this._activeTimer = null;
    }
    this.setData({ activeToolId: id });
  },

  onToolTouchEnd: function () {
    var self = this;
    if (this._activeTimer) {
      clearTimeout(this._activeTimer);
    }
    this._activeTimer = setTimeout(function () {
      self.setData({ activeToolId: '' });
      self._activeTimer = null;
    }, 150);
  },

  applyFilters: function () {
    try {
      var keyword = this.data.keyword;
      var categoryId = this.data.categoryId;
      var rawTools = this.searchTools(keyword, categoryId === 'all' ? '' : categoryId);
      var tools = [];

      for (var i = 0; i < rawTools.length; i += 1) {
        var tool = rawTools[i];
        var recommendMeta = getRecommendMeta(tool.recommendLevel);
        var accessMeta = getAccessMeta(tool.accessibility);
        tools.push(
          Object.assign({}, tool, {
            categoryLabel: this._categoryMap[tool.toolCategory] || '未分类',
            recommendText: recommendMeta.text,
            recommendClass: recommendMeta.className,
            accessClass: accessMeta.className,
            accessText: tool.accessibility || '未知',
          })
        );
      }

      this.setData({ tools: tools, loadError: '' });
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tools applyFilters failed:', error);
      this.setData({ loadError: message, tools: [] });
    }
  },

  searchTools: function (keyword, categoryId) {
    var lowerKeyword = (keyword || '').trim().toLowerCase();
    var list = this._allTools || [];
    var result = [];

    for (var i = 0; i < list.length; i += 1) {
      var tool = list[i];
      var categoryOk = !categoryId || tool.toolCategory === categoryId;
      if (!categoryOk) {
        continue;
      }

      if (!lowerKeyword) {
        result.push(tool);
        continue;
      }

      var stack =
        (tool.name || '') +
        ' ' +
        (tool.description || '') +
        ' ' +
        ((tool.tags || []).join(' ')) +
        ' ' +
        (tool.toolCategory || '');
      if (stack.toLowerCase().indexOf(lowerKeyword) !== -1) {
        result.push(tool);
      }
    }

    return this.prioritizeTools(result);
  },

  prioritizeTools: function (list) {
    var featuredToolOrderMap = this._featuredToolOrderMap || {};
    var prioritized = [];
    var remaining = [];

    for (var i = 0; i < list.length; i += 1) {
      var tool = list[i];
      var rank = featuredToolOrderMap[tool.id];
      if (typeof rank === 'number') {
        if (!prioritized[rank]) {
          prioritized[rank] = [];
        }
        prioritized[rank].push(tool);
      } else {
        remaining.push(tool);
      }
    }

    var ordered = [];
    for (var j = 0; j < prioritized.length; j += 1) {
      if (prioritized[j] && prioritized[j].length) {
        ordered = ordered.concat(prioritized[j]);
      }
    }
    return ordered.concat(remaining);
  },

  onTapTool: function (event) {
    var self = this;
    var id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    if (this._navigateTimer) {
      clearTimeout(this._navigateTimer);
      this._navigateTimer = null;
    }
    this.setData({ activeToolId: id });
    this._navigateTimer = setTimeout(function () {
      wx.navigateTo({
        url: '/pages/tool-detail/index?id=' + encode(id),
      });
      self._navigateTimer = null;
    }, 110);
  },
});
