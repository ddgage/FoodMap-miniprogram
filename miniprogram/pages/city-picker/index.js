// pages/city-picker/index.js
var CITIES = [
  { name: "北京市", code: "110000", pinyin: "beijing", letter: "B", lat: 39.9042, lng: 116.4074 },
  { name: "上海市", code: "310000", pinyin: "shanghai", letter: "S", lat: 31.2304, lng: 121.4737 },
  { name: "广州市", code: "440100", pinyin: "guangzhou", letter: "G", lat: 23.1291, lng: 113.2644 },
  { name: "深圳市", code: "440300", pinyin: "shenzhen", letter: "S", lat: 22.5431, lng: 114.0579 },
  { name: "杭州市", code: "330100", pinyin: "hangzhou", letter: "H", lat: 30.2741, lng: 120.1551 },
  { name: "成都市", code: "510100", pinyin: "chengdu", letter: "C", lat: 30.5728, lng: 104.0668 },
  { name: "重庆市", code: "500000", pinyin: "chongqing", letter: "C", lat: 29.4316, lng: 106.9123 },
  { name: "武汉市", code: "420100", pinyin: "wuhan", letter: "W", lat: 30.5928, lng: 114.3055 },
  { name: "南京市", code: "320100", pinyin: "nanjing", letter: "N", lat: 32.0603, lng: 118.7969 },
  { name: "苏州市", code: "320500", pinyin: "suzhou", letter: "S", lat: 31.299, lng: 120.5853 },
  { name: "天津市", code: "120000", pinyin: "tianjin", letter: "T", lat: 39.0842, lng: 117.2009 },
  { name: "西安市", code: "610100", pinyin: "xian", letter: "X", lat: 34.3416, lng: 108.9398 },
  { name: "长沙市", code: "430100", pinyin: "changsha", letter: "C", lat: 28.2282, lng: 112.9388 },
  { name: "厦门市", code: "350200", pinyin: "xiamen", letter: "X", lat: 24.4798, lng: 118.0894 },
  { name: "青岛市", code: "370200", pinyin: "qingdao", letter: "Q", lat: 36.0671, lng: 120.3826 },
  { name: "大连市", code: "210200", pinyin: "dalian", letter: "D", lat: 38.914, lng: 121.6147 },
  { name: "郑州市", code: "410100", pinyin: "zhengzhou", letter: "Z", lat: 34.7466, lng: 113.6254 },
  { name: "济南市", code: "370100", pinyin: "jinan", letter: "J", lat: 36.6512, lng: 116.9972 },
  { name: "合肥市", code: "340100", pinyin: "hefei", letter: "H", lat: 31.8206, lng: 117.2272 },
  { name: "南昌市", code: "360100", pinyin: "nanchang", letter: "N", lat: 28.682, lng: 115.8582 },
  { name: "福州市", code: "350100", pinyin: "fuzhou", letter: "F", lat: 26.0745, lng: 119.2965 },
  { name: "昆明市", code: "530100", pinyin: "kunming", letter: "K", lat: 25.0389, lng: 102.7183 },
  { name: "贵阳市", code: "520100", pinyin: "guiyang", letter: "G", lat: 26.647, lng: 106.6302 },
  { name: "沈阳市", code: "210100", pinyin: "shenyang", letter: "S", lat: 41.8057, lng: 123.4315 },
  { name: "哈尔滨市", code: "230100", pinyin: "haerbin", letter: "H", lat: 45.8038, lng: 126.535 },
  { name: "长春市", code: "220100", pinyin: "changchun", letter: "C", lat: 43.817, lng: 125.3235 },
  { name: "太原市", code: "140100", pinyin: "taiyuan", letter: "T", lat: 37.8706, lng: 112.5489 },
  { name: "石家庄市", code: "130100", pinyin: "shijiazhuang", letter: "S", lat: 38.0428, lng: 114.5149 },
  { name: "南宁市", code: "450100", pinyin: "nanning", letter: "N", lat: 22.817, lng: 108.3665 },
  { name: "海口市", code: "460100", pinyin: "haikou", letter: "H", lat: 20.044, lng: 110.1999 },
  { name: "兰州市", code: "620100", pinyin: "lanzhou", letter: "L", lat: 36.0611, lng: 103.8343 },
  { name: "无锡市", code: "320200", pinyin: "wuxi", letter: "W", lat: 31.4912, lng: 120.3119 },
  { name: "宁波市", code: "330200", pinyin: "ningbo", letter: "N", lat: 29.8683, lng: 121.544 },
  { name: "温州市", code: "330300", pinyin: "wenzhou", letter: "W", lat: 28.0015, lng: 120.6994 },
  { name: "珠海市", code: "440400", pinyin: "zhuhai", letter: "Z", lat: 22.2707, lng: 113.5767 },
  { name: "佛山市", code: "440600", pinyin: "foshan", letter: "F", lat: 23.0218, lng: 113.1214 },
  { name: "东莞市", code: "441900", pinyin: "dongguan", letter: "D", lat: 23.0208, lng: 113.7518 },
  { name: "三亚市", code: "460200", pinyin: "sanya", letter: "S", lat: 18.2528, lng: 109.512 },
  { name: "桂林市", code: "450300", pinyin: "guilin", letter: "G", lat: 25.2736, lng: 110.2901 }
];

var HOT_CITIES = ["北京市", "上海市", "广州市", "深圳市", "杭州市", "成都市", "重庆市", "武汉市", "南京市", "西安市"];

Page({
  data: {
    cityGroups: [],
    letters: [],
    hotCities: [],
    currentCity: { name: "杭州市", lat: 30.2741, lng: 120.1551 },
    keyword: "",
    searchList: [],
    scrollToLetter: "",
    autoFocus: false
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ currentCity: { name: app.globalData.city, lat: app.globalData.latitude, lng: app.globalData.longitude } });
    this.buildCityData();
  },

  onReady: function () {
    // 延迟聚焦，确保页面渲染完毕
    var that = this;
    setTimeout(function () { that.setData({ autoFocus: true }); }, 300);
  },

  buildCityData: function () {
    // 按首字母分组
    var groups = {};
    CITIES.forEach(function (c) {
      if (!groups[c.letter]) groups[c.letter] = [];
      groups[c.letter].push(c);
    });

    var letters = Object.keys(groups).sort();
    var cityGroups = letters.map(function (l) {
      return { letter: l, cities: groups[l] };
    });

    // 热门城市
    var hotCities = [];
    HOT_CITIES.forEach(function (name) {
      var found = CITIES.find(function (c) { return c.name === name; });
      if (found) hotCities.push(found);
    });

    this.setData({ cityGroups: cityGroups, letters: letters, hotCities: hotCities });
  },

  /**
   * 搜索输入
   */
  onSearchInput: function (e) {
    var keyword = e.detail.value.trim();
    this.setData({ keyword: keyword });

    if (!keyword) {
      this.setData({ searchList: [] });
      return;
    }

    var kw = keyword.toLowerCase();
    var result = CITIES.filter(function (c) {
      return c.name.indexOf(keyword) !== -1 || c.pinyin.indexOf(kw) !== -1;
    });
    this.setData({ searchList: result });
  },

  onSearchConfirm: function (e) {
    var keyword = e.detail.value.trim();
    if (!keyword) return;
    var kw = keyword.toLowerCase();
    var found = CITIES.find(function (c) {
      return c.name.indexOf(keyword) !== -1 || c.pinyin.indexOf(kw) !== -1;
    });
    if (found) {
      this.selectCity(found);
    }
  },

  onClearSearch: function () {
    this.setData({ keyword: "", searchList: [] });
  },

  /**
   * 选择城市
   */
  onCitySelect: function (e) {
    var city = e.currentTarget.dataset.city;
    this.selectCity(city);
  },

  selectCity: function (city) {
    var app = getApp();
    app.globalData.city = city.name;
    app.globalData.latitude = city.lat;
    app.globalData.longitude = city.lng;

    // 通知上一页城市已切换
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    if (prevPage) {
      prevPage.setData({
        city: city.name,
        latitude: city.lat,
        longitude: city.lng
      });
      prevPage.loadShops();
    }

    wx.navigateBack();
  },

  /**
   * 点击字母索引
   */
  onLetterTap: function (e) {
    var letter = e.currentTarget.dataset.letter;
    this.setData({ scrollToLetter: "group-" + letter });
  },

  onLetterTouchStart: function (e) {
    this.letterTouchMove(e);
  },

  onLetterTouchMove: function (e) {
    var touch = e.touches[0];
    var that = this;
    wx.createSelectorQuery()
      .selectAll(".letter-dot")
      .boundingClientRect(function (rects) {
        rects.forEach(function (rect, i) {
          if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            var letter = that.data.letters[i];
            if (letter) {
              that.setData({ scrollToLetter: "group-" + letter });
            }
          }
        });
      })
      .exec();
  },

  onLetterTouchEnd: function () {}
});
