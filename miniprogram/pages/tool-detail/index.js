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
    tool: null,
    relatedTutorials: [],
    loadError: '',
  },

  onLoad(options) {
    var id = decode((options && options.id) || '');
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
  },

  onOpenOfficial() {
    var tool = this.data.tool;
    if (!tool || !tool.url) return;
    if (!canOpenInWebview(tool.url)) {
      wx.setClipboardData({
        data: tool.url,
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
      url: '/pages/webview/index?url=' + encode(tool.url) + '&title=' + encode(tool.name),
    });
  },

  onOpenTutorial(event) {
    var id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: '/pages/tutorial-detail/index?id=' + encode(id),
    });
  },
});
