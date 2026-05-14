var api = require("../../utils/api");

Page({
  data: {
    posts: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    swipeIndex: -1
  },

  onLoad: function () {
    this.loadList();
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, posts: [], hasMore: true, swipeIndex: -1 });
    this.loadList().then(function () { wx.stopPullDownRefresh(); });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList();
    }
  },

  loadList: function () {
    var that = this;
    if (this.data.loading || !this.data.hasMore) return Promise.resolve();

    this.setData({ loading: true });
    return api.getHistory({
      page: this.data.page,
      pageSize: this.data.pageSize
    }).then(function (res) {
      var posts = res.posts || [];
      var newPosts = that.data.posts.concat(posts);
      that.setData({
        posts: newPosts,
        page: that.data.page + 1,
        hasMore: res.hasMore !== false,
        loading: false
      });
    }).catch(function () {
      that.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    });
  },

  onPostTap: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: "/pages/post-detail/index?id=" + id });
  },

  // ---- Swipe ----
  onTouchStart: function (e) {
    this.setData({ touchStartX: e.touches[0].clientX, swipeIndex: -1 });
  },

  onTouchMove: function (e) {
    var idx = e.currentTarget.dataset.index;
    var dx = e.touches[0].clientX - (this.data.touchStartX || 0);
    if (dx < -40) {
      this.setData({ swipeIndex: idx });
    } else if (dx > 0) {
      this.setData({ swipeIndex: -1 });
    }
  },

  onTouchEnd: function () {},

  onSwipeRemove: function (e) {
    var idx = e.currentTarget.dataset.index;
    var post = this.data.posts[idx];
    if (!post) return;
    var that = this;
    // Remove from history - we don't have a single delete API,
    // so remove from local state only (history is append-only in CF)
    var posts = that.data.posts.slice();
    posts.splice(idx, 1);
    that.setData({ posts: posts, swipeIndex: -1 });
    wx.showToast({ title: "已移除", icon: "none" });
  },

  onClearAll: function () {
    var that = this;
    wx.showModal({
      title: "清空浏览记录",
      content: "确定清空全部浏览记录？",
      success: function (res) {
        if (res.confirm) {
          that.setData({ posts: [], page: 1, hasMore: false });
          wx.showToast({ title: "已清空", icon: "none" });
        }
      }
    });
  },

  onShareAppMessage: function () {
    return { title: "浏览记录 - 美食地图", path: "/pages/map/index" };
  }
});
