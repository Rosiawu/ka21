function toText(value) {
  return typeof value === 'string' ? value : '';
}

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

function getCoverText(title) {
  var text = toText(title).trim();
  if (!text) return '教程';
  return text.slice(0, 2);
}

Page({
  data: {
    keyword: '',
    category: 'all',
    difficulty: 'all',
    categories: ['all'],
    difficulties: ['all', '小白入门', '萌新进阶', '高端玩家'],
    tutorials: [],
    activeTutorialId: '',
    loadError: '',
  },

  onLoad: function (options) {
    var keyword = decode((options && options.keyword) || '');
    var category = decode((options && options.category) || 'all');
    var difficulty = decode((options && options.difficulty) || 'all');
    this.setData({
      keyword: keyword,
      category: category || 'all',
      difficulty: difficulty || 'all',
    });

    try {
      var snapshot = require('../../utils/sync-data').getData();
      this._allTutorials = snapshot.tutorials || [];

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

    this.syncLatestData();
  },

  onShow: function () {
    var pendingKeyword = wx.getStorageSync('home_intent_tutorials_keyword');
    if (!pendingKeyword) {
      return;
    }
    wx.removeStorageSync('home_intent_tutorials_keyword');
    this.setData({
      keyword: pendingKeyword,
      category: 'all',
      difficulty: 'all',
    });
    this.applyFilters();
  },

  syncLatestData: function () {
    var self = this;
    try {
      var syncStore = require('../../utils/sync-data');
      syncStore.syncRemote({
        force: false,
        success: function (result) {
          if (!result || !result.changed) return;

          var snapshot = syncStore.getData();
          self._allTutorials = snapshot.tutorials || [];

          var categories = ['all'];
          for (var i = 0; i < self._allTutorials.length; i += 1) {
            var category = self._allTutorials[i].category;
            if (category && categories.indexOf(category) === -1) {
              categories.push(category);
            }
          }

          self.setData({ categories: categories, loadError: '' });
          self.applyFilters();
        },
      });
    } catch (error) {
      console.warn('tutorials syncLatestData failed:', error);
    }
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

  onTutorialTouchStart: function (event) {
    var id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    if (this._activeTimer) {
      clearTimeout(this._activeTimer);
      this._activeTimer = null;
    }
    this.setData({ activeTutorialId: id });
  },

  onTutorialTouchEnd: function () {
    var self = this;
    if (this._activeTimer) {
      clearTimeout(this._activeTimer);
    }
    this._activeTimer = setTimeout(function () {
      self.setData({ activeTutorialId: '' });
      self._activeTimer = null;
    }, 150);
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

      var normalized = [];
      for (var j = 0; j < result.length; j += 1) {
        normalized.push(
          Object.assign({}, result[j], {
            coverText: getCoverText(result[j].title),
          })
        );
      }

      this.setData({ tutorials: normalized, loadError: '' });
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('tutorials applyFilters failed:', error);
      this.setData({ loadError: message, tutorials: [] });
    }
  },

  onCoverError: function (event) {
    var id = event.currentTarget.dataset.id;
    if (!id) return;

    var tutorials = (this.data.tutorials || []).slice();
    var updated = false;
    for (var i = 0; i < tutorials.length; i += 1) {
      var item = tutorials[i];
      if (item.id !== id) continue;

      if (item.coverFallback && item.imageUrl !== item.coverFallback) {
        tutorials[i] = Object.assign({}, item, { imageUrl: item.coverFallback });
      } else {
        tutorials[i] = Object.assign({}, item, { imageUrl: '' });
      }
      updated = true;
      break;
    }

    if (updated) {
      this.setData({ tutorials: tutorials });
    }
  },

  onOpenTutorial: function (event) {
    var self = this;
    var id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    if (this._navigateTimer) {
      clearTimeout(this._navigateTimer);
      this._navigateTimer = null;
    }
    this.setData({ activeTutorialId: id });
    this._navigateTimer = setTimeout(function () {
      wx.navigateTo({
        url: '/pkg-tutorial/pages/tutorial-detail/index?id=' + encode(id),
      });
      self._navigateTimer = null;
    }, 110);
  },
});
