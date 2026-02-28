const FULLTEXT_API = 'https://ka21.tools/api/miniapp/tutorial-content';

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

function uniqueNonEmpty(list) {
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i += 1) {
    var item = (list[i] || '').trim();
    if (!item) continue;
    if (seen[item]) continue;
    seen[item] = true;
    out.push(item);
  }
  return out;
}

function splitParagraphs(text) {
  var raw = (text || '').replace(/\r/g, '\n').trim();
  if (!raw) return [];

  var blocks = raw.split(/\n+/);
  var result = [];

  for (var i = 0; i < blocks.length; i += 1) {
    var block = (blocks[i] || '').trim();
    if (!block) continue;

    if (block.length <= 88) {
      result.push(block);
      continue;
    }

    var sentences = block.match(/[^。！？；]+[。！？；]?/g) || [block];
    var merged = '';
    for (var j = 0; j < sentences.length; j += 1) {
      var sentence = (sentences[j] || '').trim();
      if (!sentence) continue;

      if ((merged + sentence).length > 88 && merged) {
        result.push(merged);
        merged = sentence;
      } else {
        merged += sentence;
      }
    }
    if (merged) {
      result.push(merged);
    }
  }

  return uniqueNonEmpty(result);
}

function getToolNameMap() {
  var tools = require('../../data/tools.js').tools || [];
  var map = {};
  for (var i = 0; i < tools.length; i += 1) {
    map[tools[i].id] = tools[i].name;
  }
  return map;
}

function buildHighlights(tutorial, relatedToolNames) {
  var highlights = [];
  if (tutorial.skillTags && tutorial.skillTags.length) {
    highlights.push('关键词：' + tutorial.skillTags.join('、'));
  }
  if (relatedToolNames.length) {
    highlights.push('相关工具：' + relatedToolNames.join('、'));
  }
  if (tutorial.difficultyLevel) {
    highlights.push('适合人群：' + tutorial.difficultyLevel);
  }
  if (tutorial.category) {
    highlights.push('所属分类：' + tutorial.category);
  }
  return highlights;
}

function buildFallbackBlocks(tutorial) {
  var intro = splitParagraphs(tutorial.description || '');
  var reason = splitParagraphs(tutorial.recommendReason || '');
  var paragraphs = uniqueNonEmpty(intro.concat(reason));

  if (!paragraphs.length) {
    paragraphs = ['该教程已转换为小程序阅读版本。'];
  }

  var out = [];
  for (var i = 0; i < paragraphs.length; i += 1) {
    out.push({ type: 'paragraph', text: paragraphs[i] });
  }
  return out;
}

function normalizeRemoteBlocks(blocks) {
  var out = [];
  var list = Array.isArray(blocks) ? blocks : [];

  for (var i = 0; i < list.length; i += 1) {
    var item = list[i] || {};
    var type = item.type;

    if (type === 'image') {
      var src = (item.src || '').trim();
      if (src) {
        out.push({
          type: 'image',
          src: src,
          alt: (item.alt || '').trim(),
        });
      }
      continue;
    }

    var text = (item.text || '').trim();
    if (!text) continue;

    if (type === 'heading' || type === 'quote' || type === 'list') {
      out.push({ type: type, text: text });
    } else {
      out.push({ type: 'paragraph', text: text });
    }
  }

  return out;
}

Page({
  data: {
    tutorial: null,
    relatedToolNames: [],
    contentBlocks: [],
    highlights: [],
    loadError: '',
    loadingContent: false,
    usingFallback: false,
  },

  onLoad: function (options) {
    var id = decode((options && options.id) || '');
    if (!id) {
      this.setData({ loadError: '缺少教程ID' });
      return;
    }

    try {
      var tutorials = require('../../data/tutorials.js').tutorials || [];
      var toolNameMap = getToolNameMap();

      var tutorial = null;
      for (var i = 0; i < tutorials.length; i += 1) {
        if (tutorials[i].id === id) {
          tutorial = tutorials[i];
          break;
        }
      }

      if (!tutorial) {
        this.setData({ loadError: '未找到教程内容' });
        return;
      }

      var relatedTools = tutorial.relatedTools || [];
      var relatedToolNames = [];
      for (var j = 0; j < relatedTools.length; j += 1) {
        var name = toolNameMap[relatedTools[j]];
        if (name) relatedToolNames.push(name);
      }

      this.setData({
        tutorial: tutorial,
        relatedToolNames: relatedToolNames,
        contentBlocks: buildFallbackBlocks(tutorial),
        highlights: buildHighlights(tutorial, relatedToolNames),
        loadError: '',
        loadingContent: true,
        usingFallback: true,
      });

      wx.setNavigationBarTitle({
        title: (tutorial.title || '教程详情').slice(0, 12),
      });

      this.fetchFullText(tutorial);
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tutorial-detail onLoad failed:', error);
      this.setData({ loadError: message, loadingContent: false });
    }
  },

  fetchFullText: function (tutorial) {
    var self = this;
    var requestUrl =
      FULLTEXT_API +
      '?id=' +
      encode(tutorial.id || '') +
      '&url=' +
      encode(tutorial.url || '');

    wx.request({
      url: requestUrl,
      method: 'GET',
      timeout: 20000,
      success: function (res) {
        var payload = res && res.data;
        var remote = payload && payload.data;
        var blocks = normalizeRemoteBlocks(remote && remote.blocks);

        if (res.statusCode === 200 && payload && payload.success && blocks.length) {
          self.setData({
            contentBlocks: blocks,
            loadingContent: false,
            usingFallback: !!remote.fallback,
          });
          return;
        }

        self.setData({
          loadingContent: false,
          usingFallback: true,
        });
      },
      fail: function (error) {
        console.warn('fetch tutorial full text failed:', error);
        self.setData({
          loadingContent: false,
          usingFallback: true,
        });
      },
    });
  },

  onPreviewImage: function (event) {
    var src = event.currentTarget.dataset.src;
    if (!src) return;

    var blocks = this.data.contentBlocks || [];
    var urls = [];
    for (var i = 0; i < blocks.length; i += 1) {
      if (blocks[i].type === 'image' && blocks[i].src) {
        urls.push(blocks[i].src);
      }
    }

    wx.previewImage({
      current: src,
      urls: urls.length ? urls : [src],
    });
  },

  onCopySource: function () {
    var tutorial = this.data.tutorial;
    if (!tutorial || !tutorial.url) {
      wx.showToast({ title: '暂无原文链接', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: tutorial.url,
      success: function () {
        wx.showToast({ title: '原文链接已复制', icon: 'none' });
      },
      fail: function () {
        wx.showToast({ title: '复制失败', icon: 'none' });
      },
    });
  },
});
