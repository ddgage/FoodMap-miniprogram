const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 高德地图 WebService API Key
const AMAP_KEY = "YOUR_AMAP_KEY";

/**
 * 周边搜索 - 优先查本地数据库，补充高德POI数据
 */
async function nearbySearch(params) {
  const { latitude, longitude, category, radius = 3000, page = 1, pageSize = 20 } = params;

  let query = db.collection("shops").where({
    status: "active"
  });

  if (category && category !== "全部") {
    query = query.where({ category });
  }

  const localResult = await query.get();
  let shops = localResult.data || [];

  // 本地数据不足时，调用高德POI补充
  if (shops.length < pageSize) {
    try {
      const amapShops = await fetchAmapPOI(latitude, longitude, category, radius, page);
      const localNames = new Set(shops.map(s => s.name));
      const newShops = amapShops
        .filter(s => !localNames.has(s.name))
        .map(s => ({
          _id: "",
          name: s.name,
          category: s.type || "美食",
          address: s.address || "",
          location: s.location ? {
            lat: parseFloat(s.location.split(",")[1]),
            lng: parseFloat(s.location.split(",")[0])
          } : null,
          phone: s.tel || "",
          rating: s.biz_ext ? parseFloat(s.biz_ext.rating) || 0 : 0,
          avg_price: s.biz_ext ? parseFloat(s.biz_ext.cost) || 0 : 0,
          photos: s.photos ? s.photos.map(p => p.url) : [],
          status: "active",
          source: "amap"
        }));
      shops = shops.concat(newShops);
    } catch (err) {
      console.log("高德POI请求失败:", err);
    }
  }

  return { shops, total: shops.length };
}

/**
 * 调用高德周边搜索API（云函数Node.js环境，使用https）
 */
function fetchAmapPOI(latitude, longitude, category, radius, page) {
  const https = require("https");
  const keywords = category && category !== "全部" ? category : "美食";
  const path = `/v3/place/around?key=${AMAP_KEY}&location=${longitude},${latitude}&keywords=${encodeURIComponent(keywords)}&radius=${radius}&offset=20&page=${page}&extensions=all`;

  return new Promise((resolve, reject) => {
    https.get({
      hostname: "restapi.amap.com",
      path: path,
      timeout: 5000
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data.status === "1") {
            resolve(data.pois || []);
          } else {
            reject(new Error(data.info || "高德API返回异常"));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

/**
 * 店铺详情
 */
async function getShopDetail(params) {
  const { id } = params;
  if (!id) {
    return { errCode: 1, errMsg: "缺少店铺ID" };
  }

  const res = await db.collection("shops").doc(id).get();
  if (!res.data) {
    return { errCode: 2, errMsg: "店铺不存在" };
  }

  return { shop: res.data };
}

exports.main = async (event, context) => {
  const { action } = event;

  switch (action) {
    case "nearby":
      return await nearbySearch(event);
    case "detail":
      return await getShopDetail(event);
    default:
      return { errCode: 400, errMsg: "Unknown action: " + action };
  }
};
