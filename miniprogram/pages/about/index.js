Page({
  data: {
    teamMembers: [],
    loadError: '',
  },

  onLoad() {
    try {
      var content = require('../../utils/content');
      this.setData({
        teamMembers: content.getTeamMembers(),
        loadError: '',
      });
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('about onLoad failed:', error);
      this.setData({ loadError: message });
      wx.showToast({ title: '关于页加载失败', icon: 'none' });
    }
  },

  onPreviewQR(event) {
    const current = event.currentTarget.dataset.url;
    if (!current) return;
    wx.previewImage({
      current,
      urls: [current],
    });
  },
});
