var DEFAULT_URL = require('../../utils/site-config').SITE_URL;

function decode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

Page({
  data: {
    url: DEFAULT_URL,
    error: '',
  },

  onLoad: function (options) {
    var safeOptions = options || {};
    var url = decode(safeOptions.url || '') || DEFAULT_URL;

    if (!/^https?:\/\//.test(url)) {
      this.setData({ error: '链接无效，无法打开。' });
      return;
    }

    this.setData({ url: url, error: '' });
  },
});
