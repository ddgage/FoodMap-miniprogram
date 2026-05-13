App({
  onLaunch: function () {
    this.globalData = {
      env: "foodmap-0g1s5ukg154a9d65",
      userInfo: null,
      isLogin: false,
      city: "杭州市",
      latitude: 30.2741,
      longitude: 120.1551
    };

    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }

    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true
    });

    this.checkLogin();
  },

  checkLogin: function () {
    wx.cloud.callFunction({
      name: "users",
      data: { action: "checkLogin" }
    }).then(res => {
      if (res.result && res.result.user) {
        const user = res.result.user;
        if (user.status === "banned") {
          this.globalData.userInfo = null;
          this.globalData.isLogin = false;
          wx.showModal({
            title: "账号异常",
            content: "您的账号已被限制使用",
            showCancel: false,
            success: () => {
              wx.exitMiniProgram && wx.exitMiniProgram();
            }
          });
          return;
        }
        this.globalData.userInfo = user;
        this.globalData.isLogin = true;
      }
    }).catch(() => {});
  },

  doLogin: function () {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: "用于完善个人资料"
      }).then(profileRes => {
        const userInfo = profileRes.userInfo;
        wx.cloud.callFunction({
          name: "users",
          data: {
            action: "login",
            nickname: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }
        }).then(res => {
          if (res.result && res.result.user) {
            if (res.result.user.status === "banned") {
              wx.showModal({
                title: "账号异常",
                content: "您的账号已被限制使用",
                showCancel: false
              });
              reject(new Error("user banned"));
              return;
            }
            this.globalData.userInfo = res.result.user;
            this.globalData.isLogin = true;
            resolve(res.result.user);
          } else {
            reject(new Error("login failed"));
          }
        }).catch(reject);
      }).catch(reject);
    });
  },

  globalData: {
    env: "foodmap-0g1s5ukg154a9d65",
    userInfo: null,
    isLogin: false,
    city: "杭州市",
    latitude: 30.2741,
    longitude: 120.1551
  }
});
