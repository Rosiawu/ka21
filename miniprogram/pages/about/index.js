const TEAM_ASSET_PREFIX = '../../assets/team-jpg';
const DEFAULT_AVATAR = `${TEAM_ASSET_PREFIX}/avatar-wuman.jpg`;
const DEFAULT_QR = `${TEAM_ASSET_PREFIX}/qr-wuman.png`;
const TEAM_LOCAL_IDS = {
  wuman: true,
  cool: true,
  xiaojinyu: true,
  azhen: true,
  loki: true,
  washu: true,
  labi: true,
  william: true,
  beiguo: true,
  jinwei: true,
  rongrong: true,
  yoji: true,
  feifei: true,
  seele: true,
  tangshui: true,
};

function normalizeId(id) {
  return String(id || '').toLowerCase().trim();
}

function normalizeMemberAssets(member) {
  var normalizedId = normalizeId(member.id);
  var useLocalAsset = !!TEAM_LOCAL_IDS[normalizedId];
  var avatar = useLocalAsset
    ? `${TEAM_ASSET_PREFIX}/avatar-${normalizedId}.jpg`
    : (member.avatar || '');
  var qr = useLocalAsset
    ? `${TEAM_ASSET_PREFIX}/qr-${normalizedId}.png`
    : (member.wechatQR || '');
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
