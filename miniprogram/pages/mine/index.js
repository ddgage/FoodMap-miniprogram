// pages/mine/index.js
var api = require("../../utils/api");

Page({
  data: {
    userInfo: {},
    favCount: 0,
    historyCount: 0,
    loading: false
  },

  onLoad: function () {
    this.initUser();
  },

  onShow: function () {
    this.initUser();
  },

  initUser: function () {
    var app = getApp();
    if (app.globalData.isLogin && app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
      this.loadCounts();
    } else {
      this.setData({ userInfo: {} });
    }
  },

  loadCounts: function () {
    var that = this;
    // 并行加载收藏和浏览计数
    api.getFavList({ page: 1, pageSize: 1 }).then(function (res) {
      that.setData({ favCount: res.total || 0 });
    }).catch(function () {});

    api.getHistory({ page: 1, pageSize: 1 }).then(function (res) {
      that.setData({ historyCount: res.total || 0 });
    }).catch(function () {});
  },

  /**
   * 微信一键登录
   */
  onLogin: function () {
    var that = this;
    var app = getApp();
    this.setData({ loading: true });

    app.doLogin().then(function (user) {
      that.setData({ userInfo: user, loading: false });
      that.loadCounts();
      wx.showToast({ title: "登录成功", icon: "success" });
    }).catch(function (err) {
      that.setData({ loading: false });
      if (err.message !== "user banned") {
        wx.showToast({ title: "登录失败", icon: "none" });
      }
    });
  },

  /**
   * 编辑资料
   */
  onEditProfile: function () {
    var that = this;
    if (!this.data.userInfo._id) {
      this.onLogin();
      return;
    }

    wx.showActionSheet({
      itemList: ["修改昵称", "更换头像"],
      success: function (res) {
        if (res.tapIndex === 0) {
          that.changeNickname();
        } else if (res.tapIndex === 1) {
          that.changeAvatar();
        }
      }
    });
  },

  changeNickname: function () {
    var that = this;
    wx.showModal({
      title: "修改昵称",
      editable: true,
      placeholderText: "请输入新昵称",
      success: function (res) {
        if (res.confirm && res.content) {
          var nickname = res.content.trim();
          if (!nickname) return;
          that.updateUser({ nickname: nickname });
        }
      }
    });
  },

  changeAvatar: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: function (res) {
        var tempFilePath = res.tempFilePaths[0];
        // 上传到云存储
        that.setData({ loading: true });
        var cloudPath = "avatars/" + Date.now() + ".png";
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath
        }).then(function (uploadRes) {
          return that.updateUser({ avatarUrl: uploadRes.fileID });
        }).catch(function () {
          that.setData({ loading: false });
          wx.showToast({ title: "上传失败", icon: "none" });
        });
      }
    });
  },

  updateUser: function (data) {
    var that = this;
    var app = getApp();

    api.updateProfile({
      nickname: data.nickname,
      avatarUrl: data.avatarUrl
    }).then(function () {
      var userInfo = that.data.userInfo;
      if (data.nickname) userInfo.nickname = data.nickname;
      if (data.avatarUrl) userInfo.avatar_url = data.avatarUrl;
      app.globalData.userInfo = userInfo;
      that.setData({ userInfo: userInfo, loading: false });
      wx.showToast({ title: "修改成功", icon: "success" });
    }).catch(function () {
      that.setData({ loading: false });
      wx.showToast({ title: "修改失败", icon: "none" });
    });
  },

  /**
   * 跳转收藏列表 - 跳转探店详情模拟列表
   */
  onGoFavorites: function () {
    if (!this.data.userInfo._id) {
      this.onLogin();
      return;
    }
    wx.showToast({ title: "收藏列表开发中", icon: "none" });
  },

  onGoHistory: function () {
    if (!this.data.userInfo._id) {
      this.onLogin();
      return;
    }
    wx.showToast({ title: "浏览记录开发中", icon: "none" });
  },

  onAbout: function () {
    wx.showModal({
      title: "关于美食地图",
      content: "美食地图是一款基于微信小程序的本地美食发现平台。通过地图探索周边美食店铺，浏览探店视频笔记，收藏感兴趣的内容。",
      showCancel: false
    });
  },

  onShareAppMessage: function () {
    return {
      title: "美食地图 - 发现身边美味",
      path: "/pages/map/index"
    };
  }
});
