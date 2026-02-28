function toText(value) {
  return typeof value === 'string' ? value : '';
}

function encode(value) {
  return encodeURIComponent(value || '');
}

Page({
  data: {
    keyword: '',
    category: 'all',
    difficulty: 'all',
    categories: ['all'],
    difficulties: ['all', '小白入门', '萌新进阶', '高端玩家'],
    tutorials: [],
    loadError: '',
  },

  onLoad: function () {
    try {
      this._allTutorials = require('../../data/tutorials.js').tutorials || [];

      var categories = ['all'];
      for (var i = 0; i < this._allTutorials.length; i += 1) {
        var category = this._allTutorials[i].category;
        if (category && categories.indexOf(category) === -1) {
          categories.push(category);
        }
      }

      this.setData({
        categories: categories,
        loadError: '',
      });
      this.applyFilters();
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tutorials onLoad failed:', error);
      this.setData({ loadError: message, tutorials: [] });
      wx.showToast({ title: '教程加载失败', icon: 'none' });
    }
  },

  onKeywordInput: function (event) {
    this.setData({ keyword: event.detail.value });
    this.applyFilters();
  },

  onSelectCategory: function (event) {
    this.setData({ category: event.currentTarget.dataset.value || 'all' });
    this.applyFilters();
  },

  onSelectDifficulty: function (event) {
    this.setData({ difficulty: event.currentTarget.dataset.value || 'all' });
    this.applyFilters();
  },

  onResetFilters: function () {
    this.setData({
      keyword: '',
      category: 'all',
      difficulty: 'all',
    });
    this.applyFilters();
  },

  applyFilters: function () {
    try {
      var keyword = toText(this.data.keyword).trim().toLowerCase();
      var category = this.data.category;
      var difficulty = this.data.difficulty;
      var list = this._allTutorials || [];
      var result = [];

      for (var i = 0; i < list.length; i += 1) {
        var item = list[i];
        var categoryOk = !category || category === 'all' || item.category === category;
        var difficultyOk = !difficulty || difficulty === 'all' || item.difficultyLevel === difficulty;
        if (!categoryOk || !difficultyOk) {
          continue;
        }

        if (!keyword) {
          result.push(item);
          continue;
        }

        var stack =
          toText(item.title) +
          ' ' +
          toText(item.author) +
          ' ' +
          toText(item.recommendReason) +
          ' ' +
          toText(item.category) +
          ' ' +
          ((item.skillTags || []).join(' '));
        if (stack.toLowerCase().indexOf(keyword) !== -1) {
          result.push(item);
        }
      }

      this.setData({ tutorials: result, loadError: '' });
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tutorials applyFilters failed:', error);
      this.setData({ loadError: message, tutorials: [] });
    }
  },

  onOpenTutorial: function (event) {
    var id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: '/pages/tutorial-detail/index?id=' + encode(id),
    });
  },
});
