/**
 * 云函数调用封装
 */
function callFunction(name, data) {
  return wx.cloud.callFunction({ name, data }).then(res => {
    if (res.result && res.result.errCode) {
      wx.showToast({ title: res.result.errMsg || "请求失败", icon: "none" });
      return Promise.reject(res.result);
    }
    return res.result;
  });
}

module.exports = {
  // POI
  nearbySearch: (params) => callFunction("poi", { action: "nearby", ...params }),
  getShopDetail: (params) => callFunction("poi", { action: "detail", ...params }),
  getCategories: () => callFunction("poi", { action: "listCategories" }),
  reverseGeocode: (latitude, longitude) => callFunction("poi", { action: "reverseGeocode", latitude, longitude }),

  // Posts
  getPostList: (params) => callFunction("posts", { action: "list", ...params }),
  getPostDetail: (params) => callFunction("posts", { action: "detail", ...params }),
  incViewCount: (postId) => callFunction("posts", { action: "view", postId }),

  // Users
  userLogin: (params) => callFunction("users", { action: "login", ...params }),
  updateProfile: (params) => callFunction("users", { action: "updateProfile", ...params }),
  checkLogin: () => callFunction("users", { action: "checkLogin" }),

  // Favorites
  toggleFav: (postId) => callFunction("favorites", { action: "toggle", postId }),
  getFavList: (params) => callFunction("favorites", { action: "list", ...params }),
  addHistory: (postId) => callFunction("favorites", { action: "addHistory", postId }),
  getHistory: (params) => callFunction("favorites", { action: "history", ...params }),
};
