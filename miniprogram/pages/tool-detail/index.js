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
    tool: null,
    relatedTutorials: [],
    loadError: '',
  },

  onLoad(options) {
    var id = decode((options && options.id) || '');
    this._toolId = id;
    if (!id) {
      wx.showToast({ title: '缺少工具ID', icon: 'none' });
      return;
    }

    try {
      var content = require('../../utils/content');
      var tool = content.getToolById(id);
      if (!tool) {
        wx.showToast({ title: '工具不存在', icon: 'none' });
        return;
      }

      var relatedTutorials = [];
      var relatedIds = tool.relatedTutorials || [];
      for (var i = 0; i < relatedIds.length; i += 1) {
        var tutorial = content.getTutorialById(relatedIds[i]);
        if (tutorial) {
          relatedTutorials.push(tutorial);
        }
      }

      var recommendMeta = getRecommendMeta(tool.recommendLevel);
      var accessMeta = getAccessMeta(tool.accessibility);

      var displayTool = Object.assign({}, tool, {
        categoryLabel: content.getCategoryLabel(tool.toolCategory),
        recommendText: recommendMeta.text,
        recommendClass: recommendMeta.className,
        accessClass: accessMeta.className,
      });

      this.setData({
        tool: displayTool,
        relatedTutorials: relatedTutorials,
        loadError: '',
      });

      wx.setNavigationBarTitle({
        title: tool.name + ' 详情',
      });
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tool-detail onLoad failed:', error);
      this.setData({ loadError: message });
      wx.showToast({ title: '详情加载失败', icon: 'none' });
    }

    this.syncLatestData();
  },

  syncLatestData: function () {
    var self = this;
    var id = this._toolId;
    if (!id) return;
    try {
      var syncStore = require('../../utils/sync-data');
      syncStore.syncRemote({
        force: false,
        success: function (result) {
          if (result && result.changed) {
            self.onLoad({ id: encode(id) });
          }
        },
      });
    } catch (error) {
      console.warn('tool-detail syncLatestData failed:', error);
    }
  },

  onOpenTutorial(event) {
    var id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: '/pkg-tutorial/pages/tutorial-detail/index?id=' + encode(id),
    });
  },
});
