// pages/post-detail/index.js
var api = require("../../utils/api");

Page({
  data: {
    postId: "",
    post: {},
    shop: null,
    favorited: false,
    loading: false
  },

  onLoad: function (options) {
    var id = options.id || options.scene;
    if (!id) {
      wx.showToast({ title: "参数错误", icon: "none" });
      setTimeout(function () { wx.navigateBack(); }, 1500);
      return;
    }
    this.setData({ postId: id });
    this.loadDetail();
    this.addBrowseHistory();
  },

  loadDetail: function () {
    var that = this;
    this.setData({ loading: true });

    api.getPostDetail({ id: this.data.postId }).then(function (res) {
      that.setData({
        post: res.post || {},
        shop: res.shop || null,
        loading: false
      });
      that.checkFavStatus();
    }).catch(function () {
      that.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    });
  },

  addBrowseHistory: function () {
    api.addHistory(this.data.postId).catch(function () {});
    api.incViewCount(this.data.postId).catch(function () {});
  },

  checkFavStatus: function () {
    var that = this;
    api.getFavList({ page: 1, pageSize: 200 }).then(function (res) {
      var favs = res.favorites || [];
      var isFav = false;
      for (var i = 0; i < favs.length; i++) {
        if (favs[i].post_id === that.data.postId) {
          isFav = true;
          break;
        }
      }
      that.setData({ favorited: isFav });
    }).catch(function () {});
  },

  /**
   * 收藏/取消收藏
   */
  onToggleFav: function () {
    var that = this;
    var app = getApp();
    if (!app.globalData.isLogin) {
      app.doLogin().then(function () {
        that.doFavToggle();
      }).catch(function () {});
      return;
    }
    this.doFavToggle();
  },

  doFavToggle: function () {
    var that = this;
    api.toggleFav(this.data.postId).then(function (res) {
      var favorited = res.favorited;
      var post = that.data.post;
      post.fav_count = (post.fav_count || 0) + (favorited ? 1 : -1);
      that.setData({ favorited: favorited, post: post });
      wx.showToast({ title: favorited ? "已收藏" : "已取消收藏", icon: "none" });
    }).catch(function () {
      wx.showToast({ title: "操作失败", icon: "none" });
    });
  },

  /**
   * 点击视频封面 → 跳转外部平台
   */
  onVideoTap: function () {
    var videoUrl = this.data.post.video_url;
    if (!videoUrl) {
      wx.showToast({ title: "暂无视频链接", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: videoUrl,
      success: function () {
        wx.showModal({
          title: "观看视频",
          content: "视频链接已复制，请在浏览器或对应App中打开",
          showCancel: false
        });
      }
    });
  },

  /**
   * 跳转地图导航
   */
  onMapNav: function () {
    var shop = this.data.shop;
    if (!shop || !shop.location) return;
    var loc = shop.location;
    wx.openLocation({
      latitude: loc.lat || loc.latitude || 0,
      longitude: loc.lng || loc.longitude || 0,
      name: shop.name || "",
      address: shop.address || "",
      scale: 16
    });
  },

  /**
   * 美团团购
   */
  onMeituanTap: function () {
    var shop = this.data.shop;
    if (!shop || !shop.meituan_url) {
      wx.showToast({ title: "暂无团购链接", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: shop.meituan_url,
      success: function () {
        wx.showModal({
          title: "美团团购",
          content: "链接已复制，请在浏览器中打开",
          showCancel: false
        });
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: this.data.post.title || "美食探店",
      path: "/pages/post-detail/index?id=" + this.data.postId
    };
  }
});
