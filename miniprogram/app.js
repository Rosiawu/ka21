App({
  globalData: {
    appName: 'KA21工具导航小程序',
  },
  onLaunch: function () {
    try {
      var syncData = require('./utils/sync-data');
      syncData.syncRemote({
        force: false,
      });
    } catch (error) {
      console.warn('miniapp initial sync failed:', error);
    }
  },
});
