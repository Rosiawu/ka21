const DEFAULT_AVATAR = 'https://ka21.tools/images/team/avatar-wuman.png';
const DEFAULT_QR = 'https://ka21.tools/images/team/qr-wuman.png';

function normalizeMemberAssets(member) {
  var avatar = member.avatar || DEFAULT_AVATAR;
  var qr = member.wechatQR || DEFAULT_QR;
  return Object.assign({}, member, {
    avatar: avatar,
    wechatQR: qr,
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
      [`teamMembers[${index}].avatar`]: DEFAULT_AVATAR,
    });
  },

  onQRError(event) {
    var index = event.currentTarget.dataset.index;
    if (index === undefined || index === null) return;
    this.setData({
      [`teamMembers[${index}].wechatQR`]: DEFAULT_QR,
    });
  },
});
