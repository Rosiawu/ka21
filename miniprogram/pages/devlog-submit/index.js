const api = require('../../utils/api');

Page({
  data: {
    title: '',
    author: '',
    body: '',
    images: [],
    submitting: false,
    canSubmit: false,
    message: '',
    submitSuccess: false,
  },

  syncCanSubmit: function () {
    const canSubmit = !!(this.data.title.trim() && this.data.body.trim());
    this.setData({ canSubmit: canSubmit });
  },

  handleTitleInput: function (event) {
    this.setData({ title: event.detail.value || '' });
    this.syncCanSubmit();
  },

  handleAuthorInput: function (event) {
    this.setData({ author: event.detail.value || '' });
  },

  handleBodyInput: function (event) {
    this.setData({ body: event.detail.value || '' });
    this.syncCanSubmit();
  },

  chooseImages: async function () {
    try {
      const result = await wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });
      const tempFiles = (result.tempFiles || []).slice(0, 9);
      const dataUrls = await Promise.all(
        tempFiles.map((file) => api.fileToDataUrl(file.tempFilePath))
      );
      this.setData({
        images: dataUrls.filter(Boolean),
        message: '',
        submitSuccess: false,
      });
    } catch (error) {
      if (error && error.errMsg && error.errMsg.indexOf('cancel') >= 0) return;
      this.setData({ message: '图片读取失败，请重试。', submitSuccess: false });
    }
  },

  submitDevlog: async function () {
    if (!this.data.canSubmit || this.data.submitting) return;
    this.setData({ submitting: true, message: '', submitSuccess: false });
    try {
      const result = await api.request({
        url: '/api/devlog/submit',
        method: 'POST',
        data: {
          title: this.data.title,
          author: this.data.author,
          body: this.data.body,
          images: this.data.images,
        },
        timeout: 20000,
      });
      if (!result || !result.success) {
        this.setData({
          message: (result && result.message) || '提交失败，请重试。',
          submitSuccess: false,
        });
        return;
      }
      this.setData({
        title: '',
        author: '',
        body: '',
        images: [],
        canSubmit: false,
        message: '已提交到 GitHub，等自动部署完成后，开发日志页就会更新。',
        submitSuccess: true,
      });
      wx.showToast({
        title: '提交成功',
        icon: 'success',
      });
    } catch (error) {
      this.setData({
        message: (error && error.message) || '提交失败，请重试。',
        submitSuccess: false,
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
