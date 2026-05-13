// pages/explore/index.js
var api = require("../../utils/api");

var DEFAULT_CATEGORIES = [{ name: "全部", _id: "all" }];

Page({
  data: {
    categories: DEFAULT_CATEGORIES,
    currentCategory: "全部",
    currentSort: "latest",
    postList: [],
    leftList: [],
    rightList: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad: function () {
    this.loadCategories();
    this.loadPosts();
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
      var fallback = ["全部", "火锅", "日料", "烧烤", "咖啡", "甜品", "川菜", "粤菜", "西餐", "小吃"];
      var cats = fallback.map(function (name) {
        return { name: name, _id: name };
      });
      that.setData({ categories: cats });
    });
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, postList: [], hasMore: true });
    this.loadPosts().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts();
    }
  },

  loadPosts: function () {
    var that = this;
    if (this.data.loading || !this.data.hasMore) return Promise.resolve();

    this.setData({ loading: true });

    return api.getPostList({
      page: this.data.page,
      pageSize: this.data.pageSize,
      sort: this.data.currentSort,
      category: this.data.currentCategory
    }).then(function (res) {
      var posts = res.posts || [];
      var newList = that.data.postList.concat(posts);
      var leftList = [];
      var rightList = [];

      // 简单瀑布流分配：交替放入左右列
      newList.forEach(function (item, i) {
        if (i % 2 === 0) {
          leftList.push(item);
        } else {
          rightList.push(item);
        }
      });

      that.setData({
        postList: newList,
        leftList: leftList,
        rightList: rightList,
        page: that.data.page + 1,
        hasMore: res.hasMore !== false,
        loading: false
      });
    }).catch(function () {
      that.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    });
  },

  onSortTap: function (e) {
    var sort = e.currentTarget.dataset.sort;
    if (sort === this.data.currentSort) return;
    this.setData({
      currentSort: sort,
      page: 1,
      postList: [],
      leftList: [],
      rightList: [],
      hasMore: true
    });
    this.loadPosts();
  },

  onCategoryTap: function (e) {
    var category = e.currentTarget.dataset.category;
    if (category === this.data.currentCategory) return;
    this.setData({
      currentCategory: category,
      page: 1,
      postList: [],
      leftList: [],
      rightList: [],
      hasMore: true
    });
    this.loadPosts();
  },

  onPostTap: function (e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/post-detail/index?id=" + id });
  },

  onSearchTap: function () {
    wx.showToast({ title: "搜索功能开发中", icon: "none" });
  },

  onShareAppMessage: function () {
    return {
      title: "美食探店 - 发现身边美味",
      path: "/pages/explore/index"
    };
  }
});
