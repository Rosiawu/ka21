const LOCAL_AVATAR_BY_ID = {
  fenglaoshi: '../../public/team/avatar-fenglaoshi.jpg',
};

function normalizeMemberAssets(member) {
  var avatar = LOCAL_AVATAR_BY_ID[member.id] || (typeof member.avatar === 'string' ? member.avatar : '');
  var qr = typeof member.wechatQR === 'string' ? member.wechatQR : '';
  return Object.assign({}, member, {
    avatar: avatar,
    wechatQR: qr,
    wechatAccountDisplay: member.wechatAccount || '待补充',
  });
}

Page({
  data: {
    teamMembers: [],
    loadError: '',
  },

  onLoad() {
    try {
      var content = require('../../utils/content');
      var members = content.getTeamMembers().map(normalizeMemberAssets);
      this.setData({
        teamMembers: members,
        loadError: '',
      });
    } catch (error) {
      var message = error && error.message ? error.message : String(error);
      console.error('about onLoad failed:', error);
      this.setData({ loadError: message });
      wx.showToast({ title: '关于页加载失败', icon: 'none' });
    }

    this.syncLatestData();
  },

  syncLatestData: function () {
    var self = this;
    try {
      var syncStore = require('../../utils/sync-data');
      syncStore.syncRemote({
        force: false,
        success: function (result) {
          if (!result || !result.changed) return;
          var content = require('../../utils/content');
          var members = content.getTeamMembers().map(normalizeMemberAssets);
          self.setData({ teamMembers: members, loadError: '' });
        },
      });
    } catch (error) {
      console.warn('about syncLatestData failed:', error);
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

  onAvatarError(event) {
    var index = event.currentTarget.dataset.index;
    if (index === undefined || index === null) return;
    this.setData({
      [`teamMembers[${index}].avatar`]: '',
    });
  },

  onQRError(event) {
    var index = event.currentTarget.dataset.index;
    if (index === undefined || index === null) return;
    this.setData({
      [`teamMembers[${index}].wechatQR`]: '',
    });
  },
});
