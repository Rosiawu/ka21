const STORAGE_KEY = 'miniapp_sync_snapshot_v1';
const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const { SNAPSHOT_URL } = require('./site-config');

function getBundledData() {
  return {
    tools: (require('../data/tools.js').tools || []).slice(),
    tutorials: (require('../data/tutorials.js').tutorials || []).slice(),
    categories: (require('../data/categories.js').categories || []).slice(),
    teamMembers: (require('../data/team-members.js').teamMembers || []).slice(),
    weeklyPicks: require('../data/weekly-picks.js').weeklyPicks || { toolIds: [], maxItems: 6 },
    devLogs: (require('../data/devlogs.js').devLogs || []).slice(),
  };
}

function hasWxStorage() {
  return typeof wx !== 'undefined' && wx && typeof wx.getStorageSync === 'function';
}

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

function isValidData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!isArray(data.tools)) return false;
  if (!isArray(data.tutorials)) return false;
  if (!isArray(data.categories)) return false;
  if (!isArray(data.teamMembers)) return false;
  if (!data.weeklyPicks || typeof data.weeklyPicks !== 'object') return false;
  if (!isArray(data.devLogs)) return false;
  return true;
}

function getSnapshotRecord() {
  if (!hasWxStorage()) return null;
  try {
    var value = wx.getStorageSync(STORAGE_KEY);
    if (!value || typeof value !== 'object') return null;
    if (!value.data || !isValidData(value.data)) return null;
    return value;
  } catch (error) {
    return null;
  }
}

function getData() {
  var bundled = getBundledData();
  var record = getSnapshotRecord();
  if (!record || !record.data) {
    return bundled;
  }
  var remote = record.data;
  return {
    tools: isArray(remote.tools) ? remote.tools : bundled.tools,
    tutorials: isArray(remote.tutorials) ? remote.tutorials : bundled.tutorials,
    categories: isArray(remote.categories) ? remote.categories : bundled.categories,
    teamMembers: isArray(remote.teamMembers) ? remote.teamMembers : bundled.teamMembers,
    weeklyPicks: remote.weeklyPicks && typeof remote.weeklyPicks === 'object'
      ? remote.weeklyPicks
      : bundled.weeklyPicks,
    devLogs: isArray(remote.devLogs) ? remote.devLogs : bundled.devLogs,
  };
}

function syncRemote(options) {
  var opts = options || {};
  var force = !!opts.force;
  var intervalMs = typeof opts.intervalMs === 'number' ? opts.intervalMs : DEFAULT_SYNC_INTERVAL_MS;
  var onSuccess = typeof opts.success === 'function' ? opts.success : function () {};
  var onFail = typeof opts.fail === 'function' ? opts.fail : function () {};

  if (typeof wx === 'undefined' || !wx || typeof wx.request !== 'function') {
    onFail({ message: 'wx.request unavailable' });
    return;
  }

  var current = getSnapshotRecord();
  var now = Date.now();
  if (!force && current && current.checkedAt && now - current.checkedAt < intervalMs) {
    onSuccess({
      synced: false,
      changed: false,
      version: current.version || '',
      reason: 'interval-skip',
    });
    return;
  }

  wx.request({
    url: SNAPSHOT_URL,
    method: 'GET',
    timeout: 8000,
    success: function (res) {
      try {
        if (!res || res.statusCode !== 200 || !res.data || !res.data.success || !res.data.data) {
          throw new Error('snapshot response invalid');
        }

        var payload = res.data.data;
        if (!isValidData(payload)) {
          throw new Error('snapshot data invalid');
        }

        var previousVersion = (current && current.version) || '';
        var nextVersion = payload.version || '';
        var changed = !!nextVersion && nextVersion !== previousVersion;
        var checkedAt = Date.now();

        if (hasWxStorage()) {
          wx.setStorageSync(STORAGE_KEY, {
            version: nextVersion,
            checkedAt: checkedAt,
            syncedAt: changed ? checkedAt : (current && current.syncedAt) || checkedAt,
            data: payload,
          });
        }

        onSuccess({
          synced: true,
          changed: changed,
          version: nextVersion,
        });
      } catch (error) {
        onFail({
          message: error && error.message ? error.message : String(error),
        });
      }
    },
    fail: function (error) {
      onFail({
        message: error && error.errMsg ? error.errMsg : 'snapshot request failed',
      });
    },
  });
}

module.exports = {
  getData,
  syncRemote,
};
