const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const ADMIN_TOKEN = "foodmap-admin-2024-secret";

// ---- Helpers ----

function ok(data) {
  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ code: 0, data }) };
}
function fail(code, msg) {
  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ code, msg }) };
}
function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function parseBody(event) {
  if (!event.body) return {};
  try { return JSON.parse(event.body); } catch (e) { return {}; }
}

function checkAuth(event) {
  const auth = (event.headers || {}).Authorization || (event.headers || {}).authorization || "";
  return auth === "Bearer " + ADMIN_TOKEN;
}

// ---- Dashboard ----

async function dashboardStats() {
  const [shopCount, postCount, userCount] = await Promise.all([
    db.collection("shops").where({ status: "active" }).count(),
    db.collection("posts").where({ status: "published" }).count(),
    db.collection("users").count()
  ]);

  // 今日浏览量
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today;

  // 从posts表汇总view_count近似今日浏览（实际可用browse_history精确统计）
  const postsRes = await db.collection("posts").where({ status: "published" }).get();
  const todayViews = postsRes.data.reduce((sum, p) => sum + (p.view_count || 0), 0);

  return {
    shopCount: shopCount.total,
    postCount: postCount.total,
    userCount: userCount.total,
    todayViews
  };
}

async function trendData() {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const cnt = await db.collection("browse_history")
      .where({ created_at: _.gte(d).and(_.lt(next)) })
      .count();
    result.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count: cnt.total
    });
  }
  return result;
}

async function hotFavs() {
  const res = await db.collection("posts")
    .where({ status: "published" })
    .orderBy("fav_count", "desc")
    .limit(10)
    .get();
  return res.data.map(p => ({ _id: p._id, title: p.title, fav_count: p.fav_count || 0 }));
}

// ---- Shops CRUD ----

async function listShops(params) {
  const { page = 1, pageSize = 10, keyword = "", category = "", status = "" } = params;

  let query = db.collection("shops");

  const conditions = {};
  if (keyword) {
    conditions.name = db.RegExp({ regexp: keyword, options: "i" });
  }
  if (category) conditions.category = category;
  if (status) conditions.status = status;

  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }

  const totalResult = await query.count();
  const res = await query
    .orderBy("created_at", "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  return {
    list: res.data,
    total: totalResult.total,
    page,
    pageSize
  };
}

async function getShop(params) {
  const { id } = params;
  if (!id) throw new Error("缺少ID");
  const res = await db.collection("shops").doc(id).get();
  if (!res.data) throw new Error("店铺不存在");
  return res.data;
}

async function createShop(params) {
  const { name, category, address, latitude, longitude, phone, rating, avg_price, photos, meituan_url, status } = params;
  if (!name || !category) throw new Error("名称和分类必填");

  const data = {
    name,
    category,
    address: address || "",
    location: latitude && longitude ? new db.Geo.Point(longitude, latitude) : null,
    phone: phone || "",
    rating: rating || 0,
    avg_price: avg_price || 0,
    photos: photos || [],
    meituan_url: meituan_url || "",
    status: status || "active",
    created_at: new Date()
  };
  const res = await db.collection("shops").add({ data });
  return { _id: res._id, ...data };
}

async function updateShop(params) {
  const { id, ...fields } = params;
  if (!id) throw new Error("缺少ID");

  const updateData = { ...fields };
  delete updateData._id;

  // 处理location
  if (updateData.latitude !== undefined && updateData.longitude !== undefined) {
    updateData.location = new db.Geo.Point(updateData.longitude, updateData.latitude);
    delete updateData.latitude;
    delete updateData.longitude;
  }

  await db.collection("shops").doc(id).update({ data: updateData });
  const updated = await db.collection("shops").doc(id).get();
  return updated.data;
}

async function deleteShop(params) {
  const { id } = params;
  if (!id) throw new Error("缺少ID");
  await db.collection("shops").doc(id).remove();
  return { success: true };
}

async function toggleShopStatus(params) {
  const { id } = params;
  if (!id) throw new Error("缺少ID");
  const shop = await db.collection("shops").doc(id).get();
  if (!shop.data) throw new Error("店铺不存在");
  const newStatus = shop.data.status === "active" ? "offline" : "active";
  await db.collection("shops").doc(id).update({ data: { status: newStatus } });
  return { status: newStatus };
}

// ---- Props / Categories list (for selects) ----

async function listCategories() {
  const res = await db.collection("categories").where({ status: "active" }).orderBy("sort_order", "asc").get();
  return res.data;
}

// ---- Route dispatch ----

async function handleAction(action, event) {
  const body = parseBody(event);
  const qs = event.queryStringParameters || {};

  switch (action) {
    // Dashboard
    case "stats": return await dashboardStats();
    case "trend": return await trendData();
    case "hotFavs": return await hotFavs();

    // Shops
    case "listShops": return await listShops(body);
    case "getShop": return await getShop(body);
    case "createShop": return await createShop(body);
    case "updateShop": return await updateShop(body);
    case "deleteShop": return await deleteShop(body);
    case "toggleShopStatus": return await toggleShopStatus(body);

    // Categories (for selects)
    case "listCategories": return await listCategories();

    // Auth check
    case "checkAuth": return { valid: true };

    default:
      throw new Error("Unknown action: " + action);
  }
}

exports.main = async (event, context) => {
  console.log("admin event:", JSON.stringify(event));

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  // Determine action: from path or from body
  let action;
  if (event.path) {
    // HTTP trigger: path like /admin/stats → action="stats"
    const parts = (event.path.replace(/^\/+/, "")).split("/");
    action = parts[1] || "checkAuth";
  } else if (event.action) {
    // 直接云函数调用（兼容）
    action = event.action;
  } else {
    return fail(400, "Missing action");
  }

  // Auth is required for all actions except checkAuth itself
  if (action !== "checkAuth" && !checkAuth(event)) {
    return fail(401, "未授权访问，请提供有效Token");
  }

  try {
    const data = await handleAction(action, event);
    return ok(data);
  } catch (e) {
    console.error("admin error:", e);
    return fail(500, e.message || "服务器错误");
  }
};
