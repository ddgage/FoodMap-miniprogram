var api = require("../../utils/api");

Page({
  data: {
    posts: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    showDeleteIndex: -1
  },

  onLoad: function () {
    this.loadList();
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, posts: [], hasMore: true, showDeleteIndex: -1 });
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
    return api.getFavList({
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
    if (this.data.showDeleteIndex >= 0) {
      this.setData({ showDeleteIndex: -1 });
      return;
    }
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: "/pages/post-detail/index?id=" + id });
  },

  onLongPress: function (e) {
    var index = e.currentTarget.dataset.index;
    this.setData({ showDeleteIndex: index });
  },

  onDeleteFav: function (e) {
    var idx = e.currentTarget.dataset.index;
    var post = this.data.posts[idx];
    if (!post) return;
    var that = this;
    api.toggleFav(post._id).then(function () {
      var posts = that.data.posts.slice();
      posts.splice(idx, 1);
      that.setData({ posts: posts, showDeleteIndex: -1 });
      wx.showToast({ title: "已取消收藏", icon: "none" });
    }).catch(function () {
      wx.showToast({ title: "操作失败", icon: "none" });
    });
  },

  onTapOutside: function () {
    if (this.data.showDeleteIndex >= 0) {
      this.setData({ showDeleteIndex: -1 });
    }
  },

  onShareAppMessage: function () {
    return { title: "我的收藏 - 美食地图", path: "/pages/map/index" };
  }
});
