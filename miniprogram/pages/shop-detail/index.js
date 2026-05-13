// pages/shop-detail/index.js
const api = require("../../utils/api");

Page({
  data: {
    shopId: "",
    shop: {},
    photos: [],
    previewMarker: {},
    loading: false
  },

  onLoad: function (options) {
    const id = options.id || options.scene;
    if (!id) {
      wx.showToast({ title: "参数错误", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ shopId: id });
    this.loadDetail();
  },

  loadDetail: function () {
    this.setData({ loading: true });

    api.getShopDetail({ id: this.data.shopId }).then(res => {
      const shop = res.shop || {};
      const photos = shop.photos || [];
      const loc = shop.location || {};
      const previewMarker = {
        id: 0,
        latitude: loc.lat || loc.latitude || 0,
        longitude: loc.lng || loc.longitude || 0,
        iconPath: "/images/icons/marker-active.png",
        width: 36,
        height: 44
      };

      this.setData({ shop, photos, previewMarker, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    });
  },

  /**
   * 跳转地图导航
   */
  onMapNav: function () {
    const loc = this.data.shop.location || {};
    const lat = loc.lat || loc.latitude || 0;
    const lng = loc.lng || loc.longitude || 0;
    const name = this.data.shop.name || "";

    wx.openLocation({
      latitude: lat,
      longitude: lng,
      name: name,
      address: this.data.shop.address || "",
      scale: 16
    });
  },

  /**
   * 跳转美团团购
   */
  onMeituanTap: function () {
    const url = this.data.shop.meituan_url;
    if (!url) {
      wx.showToast({ title: "暂无团购链接", icon: "none" });
      return;
    }
    // 复制链接或打开webview
    wx.setClipboardData({
      data: url,
      success: () => {
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
      title: this.data.shop.name || "美食店铺",
      path: "/pages/shop-detail/index?id=" + this.data.shopId
    };
  }
});
