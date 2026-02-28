function encode(value) {
  return encodeURIComponent(value || '');
}

Page({
  data: {
    keyword: '',
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
      const tools = content.getTools();
      const tutorials = content.getTutorials();
      const categories = content.getCategories();
      const hotTools = tools.slice(0, 8).map(function (tool) {
        return Object.assign({}, tool, {
          categoryLabel: content.getCategoryLabel(tool.toolCategory),
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
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  onSearchConfirm() {
    const keyword = (this.data.keyword || '').trim();
    if (!keyword) {
      wx.switchTab({ url: '/pages/tools/index' });
      return;
    }
    wx.navigateTo({
      url: '/pages/tools/index?keyword=' + encodeURIComponent(keyword),
    });
  },

  onTapCategory(event) {
    const categoryId = event.currentTarget.dataset.id;
    if (!categoryId) return;
    wx.navigateTo({
      url: '/pages/tools/index?category=' + encodeURIComponent(categoryId),
    });
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
      url: '/pages/tutorial-detail/index?id=' + encode(tutorialId),
    });
  },

  onQuickSearch(event) {
    const keyword = event.currentTarget.dataset.keyword || '';
    const content = require('../../utils/content');
    const matched = content.searchTools(keyword, 'all');
    if (!matched.length) return;
    this.setData({ keyword: keyword });
    wx.navigateTo({
      url: '/pages/tools/index?keyword=' + encodeURIComponent(keyword),
    });
  },
});
