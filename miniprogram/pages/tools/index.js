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

function resolveLocalIconPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') {
    return '';
  }

  var normalized = rawPath;
  if (normalized.indexOf('http://') === 0 || normalized.indexOf('https://') === 0) {
    normalized = normalized.replace(/^https?:\/\/[^/]+/, '');
  }

  if (normalized.indexOf('/icons/') === 0) {
    return '/public' + normalized;
  }
  if (normalized.indexOf('icons/') === 0) {
    return '/public/' + normalized;
  }

  return rawPath;
}

function getHostname(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  var match = url.match(/^https?:\/\/([^/]+)/i);
  return match && match[1] ? match[1].toLowerCase() : '';
}

function canOpenInWebview(url) {
  var host = getHostname(url);
  return host === 'ka21.tools' || host === 'www.ka21.tools';
}

Page({
  data: {
    keyword: '',
    categoryId: 'all',
    categories: [],
    tools: [],
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

  initData: function () {
    try {
      var categoriesData = require('../../data/categories.js').categories || [];
      var toolsData = require('../../data/tools.js').tools || [];

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
            icon: resolveLocalIconPath(tool.icon),
          })
        );
      }
      this._allTools = normalizedTools;

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

    return result;
  },

  onTapTool: function (event) {
    var id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: '/pages/tool-detail/index?id=' + encode(id),
    });
  },

  onOpenOfficial: function (event) {
    var url = event.currentTarget.dataset.url;
    var title = event.currentTarget.dataset.title || '官网';
    if (!url) {
      return;
    }
    if (!canOpenInWebview(url)) {
      wx.setClipboardData({
        data: url,
        success: function () {
          wx.showModal({
            title: '已复制链接',
            content: '该网站无法在小程序内直接打开。请粘贴到浏览器或聊天窗口访问。',
            showCancel: false,
          });
        },
        fail: function () {
          wx.showToast({ title: '复制链接失败', icon: 'none' });
        },
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/webview/index?url=' + encode(url) + '&title=' + encode(title),
    });
  },
});
