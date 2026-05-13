// pages/map/index.js
var api = require("../../utils/api");

var DEFAULT_CATEGORIES = [{ name: "全部", _id: "all" }];

Page({
  data: {
    statusBarHeight: 20,
    city: "杭州市",
    latitude: 30.2741,
    longitude: 120.1551,
    scale: 14,
    categories: DEFAULT_CATEGORIES,
    currentCategory: "全部",
    shopList: [],
    markers: [],
    currentShopId: null,
    scrollIntoView: "",
    loading: false
  },

  onLoad: function () {
    var app = getApp();
    this.setData({
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20,
      city: app.globalData.city,
      latitude: app.globalData.latitude,
      longitude: app.globalData.longitude
    });
    this.loadCategories();
    this.loadShops();
  },

  loadCategories: function () {
    var that = this;
    api.getCategories().then(function (res) {
      var cats = (res.categories || []).map(function (c) {
        return { name: c.name, _id: c._id, icon: c.icon };
      });
      cats.unshift({ name: "全部", _id: "all" });
      that.setData({ categories: cats });
    }).catch(function () {
      // 降级使用默认分类
      var fallback = ["全部", "火锅", "日料", "烧烤", "咖啡", "甜品", "川菜", "粤菜", "西餐", "小吃"];
      var cats = fallback.map(function (name) {
        return { name: name, _id: name };
      });
      that.setData({ categories: cats });
    });
  },

  onShow: function () {
    // 每次显示时刷新定位
  },

  loadShops: function () {
    var that = this;
    var latitude = this.data.latitude;
    var longitude = this.data.longitude;
    var currentCategory = this.data.currentCategory;

    this.setData({ loading: true });

    api.nearbySearch({
      latitude: latitude,
      longitude: longitude,
      category: currentCategory,
      radius: 3000
    }).then(function (res) {
      var shops = (res.shops || []).map(function (s, i) {
        // 确保每个店铺有唯一ID（AMAP数据无_id）
        if (!s._id) {
          s._id = "a" + i + "n" + Date.now();
        }
        var dist = null;
        if (s.location) {
          var lat = s.location.lat || s.location.latitude;
          var lng = s.location.lng || s.location.longitude;
          if (lat && lng) {
            dist = that.calcDistance(latitude, longitude, lat, lng);
          }
        }
        s.distance = dist ? that.formatDistance(dist) : "";
        return s;
      });

      var markers = shops.map(function (s, i) {
        var loc = s.location || {};
        return {
          id: i,
          latitude: loc.lat || loc.latitude || 0,
          longitude: loc.lng || loc.longitude || 0,
          title: s.name,
          iconPath: "/images/icons/marker.png",
          width: 36,
          height: 44,
          callout: {
            content: s.name,
            color: "#333",
            fontSize: 13,
            borderRadius: 8,
            bgColor: "#fff",
            padding: 8,
            display: "BYCLICK"
          }
        };
      });

      that.setData({ shopList: shops, markers: markers, loading: false });
      that.updateMarkerIcons();
    }).catch(function () {
      that.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    });
  },

  onCategoryTap: function (e) {
    var category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      currentShopId: null,
      scrollIntoView: ""
    });
    this.loadShops();
  },

  /**
   * 点击地图Marker → 卡片列表滚动到对应位置并高亮
   */
  onMarkerTap: function (e) {
    var markerId = e.detail.markerId;
    var shop = this.data.shopList[markerId];
    if (!shop || !shop._id) return;

    this.setData({
      currentShopId: shop._id,
      scrollIntoView: "card-" + shop._id
    });
    this.updateMarkerIcons();

    var loc = shop.location || {};
    var lat = loc.lat || loc.latitude;
    var lng = loc.lng || loc.longitude;
    if (lat && lng) {
      this.getMapContext().moveToLocation({
        latitude: lat,
        longitude: lng
      });
    }
  },

  /**
   * 点击卡片 → 地图平移选中 → 跳转店铺详情页
   */
  onCardDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    var shopList = this.data.shopList;
    var idx = -1;

    for (var i = 0; i < shopList.length; i++) {
      if (shopList[i]._id === id) {
        idx = i;
        break;
      }
    }

    if (idx < 0 || !id) {
      wx.showToast({ title: "暂无店铺信息", icon: "none" });
      return;
    }

    var shop = shopList[idx];
    this.setData({
      currentShopId: id,
      scrollIntoView: "card-" + id
    });
    this.updateMarkerIcons();

    var loc = shop.location || {};
    var lat = loc.lat || loc.latitude;
    var lng = loc.lng || loc.longitude;
    if (lat && lng) {
      this.getMapContext().moveToLocation({
        latitude: lat,
        longitude: lng
      });
    }

    var that = this;
    setTimeout(function () {
      wx.navigateTo({ url: "/pages/shop-detail/index?id=" + id });
    }, 300);
  },

  updateMarkerIcons: function () {
    var markers = this.data.markers;
    var shopList = this.data.shopList;
    var currentShopId = this.data.currentShopId;

    var updated = markers.map(function (m, i) {
      var s = shopList[i];
      var isActive = s && s._id === currentShopId;
      return Object.assign({}, m, {
        iconPath: isActive
          ? "/images/icons/marker-active.png"
          : "/images/icons/marker.png"
      });
    });
    this.setData({ markers: updated });
  },

  onLocateTap: function () {
    this.getMapContext().moveToLocation();
  },

  onRegionChange: function (e) {
    if (e.type === "end" && e.causedBy === "drag") {
      var that = this;
      this.getMapContext().getCenterLocation({
        success: function (res) {
          that.setData({
            latitude: res.latitude,
            longitude: res.longitude
          });
          that.loadShops();
        }
      });
    }
  },

  onCityTap: function () {
    wx.navigateTo({ url: "/pages/city-picker/index" });
  },

  onSearchTap: function () {
    wx.showToast({ title: "搜索功能开发中", icon: "none" });
  },

  getMapContext: function () {
    return wx.createMapContext("foodMap", this);
  },

  calcDistance: function (lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = this.toRad(lat2 - lat1);
    var dLng = this.toRad(lng2 - lng1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad: function (deg) {
    return deg * Math.PI / 180;
  },

  formatDistance: function (km) {
    if (km < 1) return Math.round(km * 1000) + "m";
    return km.toFixed(1) + "km";
  },

  onShareAppMessage: function () {
    return {
      title: "美食地图 - 发现身边美味",
      path: "/pages/map/index"
    };
  }
});
