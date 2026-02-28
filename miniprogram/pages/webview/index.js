function decode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

Page({
  data: {
    url: '',
    title: '内容详情',
    error: '',
  },

  onLoad: function (options) {
    var safeOptions = options || {};
    var url = decode(safeOptions.url || '');
    var title = decode(safeOptions.title || '内容详情');

    if (!url || !/^https?:\/\//.test(url)) {
      this.setData({ error: '链接无效，无法打开。' });
      return;
    }

    this.setData({
      url: url,
      title: title,
      error: '',
    });

    wx.setNavigationBarTitle({
      title: (title || '内容详情').slice(0, 12),
    });
  },
});
