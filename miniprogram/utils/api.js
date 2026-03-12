const API_BASE_URL = 'https://ka21.org';
const CONTRIBUTOR_STORAGE_KEY = 'miniapp_deals_contributor_v1';

function request(options) {
  const opts = options || {};
  return new Promise(function (resolve, reject) {
    wx.request({
      url: `${API_BASE_URL}${opts.url}`,
      method: opts.method || 'GET',
      data: opts.data || {},
      header: Object.assign({
        'Content-Type': 'application/json',
      }, opts.header || {}),
      timeout: opts.timeout || 10000,
      success: function (res) {
        if (!res || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error((res && res.data && res.data.message) || 'request-failed'));
          return;
        }
        resolve(res.data);
      },
      fail: function (error) {
        reject(new Error((error && error.errMsg) || 'request-failed'));
      },
    });
  });
}

function wxLogin() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (res) {
        if (!res || !res.code) {
          reject(new Error('wx-login-no-code'));
          return;
        }
        resolve(res.code);
      },
      fail: function (error) {
        reject(new Error((error && error.errMsg) || 'wx-login-failed'));
      },
    });
  });
}

function fileToDataUrl(filePath) {
  return new Promise(function (resolve, reject) {
    if (!filePath) {
      resolve('');
      return;
    }
    try {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: filePath,
        encoding: 'base64',
        success: function (res) {
          resolve(`data:image/png;base64,${res.data}`);
        },
        fail: function (error) {
          reject(new Error((error && error.errMsg) || 'avatar-read-failed'));
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

function saveContributor(contributor) {
  wx.setStorageSync(CONTRIBUTOR_STORAGE_KEY, contributor);
}

function getContributor() {
  try {
    return wx.getStorageSync(CONTRIBUTOR_STORAGE_KEY) || null;
  } catch (error) {
    return null;
  }
}

async function loginMiniappIdentity() {
  const code = await wxLogin();
  const result = await request({
    url: '/api/wechat/miniapp/login',
    method: 'POST',
    data: { code: code },
  });
  if (!result || !result.success || !result.data) {
    throw new Error((result && result.message) || 'miniapp-login-failed');
  }
  return result.data;
}

async function confirmBindSession(options) {
  const identity = await loginMiniappIdentity();
  let avatarDataUrl = options.avatarUrl || '';
  if (options.avatarFilePath) {
    avatarDataUrl = await fileToDataUrl(options.avatarFilePath || '');
  }
  const result = await request({
    url: `/api/deals/bind-sessions/${options.sessionId}/confirm`,
    method: 'POST',
    data: {
      nickname: options.nickname,
      avatarUrl: avatarDataUrl,
      openid: identity.openid,
      unionid: identity.unionid,
    },
  });
  if (!result || !result.success || !result.data || !result.data.contributor) {
    throw new Error((result && result.message) || 'bind-confirm-failed');
  }
  saveContributor(result.data.contributor);
  return result.data.contributor;
}

module.exports = {
  API_BASE_URL,
  request,
  fileToDataUrl,
  getContributor,
  saveContributor,
  loginMiniappIdentity,
  confirmBindSession,
};
