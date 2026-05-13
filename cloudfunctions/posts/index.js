const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 探店笔记列表（分页、筛选、搜索）
 */
async function listPosts(params) {
  const { page = 1, pageSize = 20, sort = "latest", keyword = "", category } = params;

  let query = db.collection("posts").where({
    status: "published"
  });

  if (keyword) {
    query = query.where({
      title: db.RegExp({ regexp: keyword, options: "i" })
    });
  }

  if (category && category !== "全部") {
    query = query.where({ tags: category });
  }

  // 排序
  let orderBy = "created_at";
  let order = "desc";
  if (sort === "popular") {
    orderBy = "fav_count";
    order = "desc";
  } else if (sort === "views") {
    orderBy = "view_count";
    order = "desc";
  }

  const totalResult = await query.count();
  const result = await query
    .orderBy(orderBy, order)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  return {
    posts: result.data,
    total: totalResult.total,
    page,
    pageSize,
    hasMore: page * pageSize < totalResult.total
  };
}

/**
 * 探店笔记详情
 */
async function getPostDetail(params) {
  const { id } = params;
  if (!id) {
    return { errCode: 1, errMsg: "缺少笔记ID" };
  }

  const res = await db.collection("posts").doc(id).get();
  if (!res.data) {
    return { errCode: 2, errMsg: "笔记不存在" };
  }

  // 关联店铺信息
  let shop = null;
  if (res.data.shop_id) {
    try {
      const shopRes = await db.collection("shops").doc(res.data.shop_id).get();
      shop = shopRes.data || null;
    } catch (e) {
      shop = null;
    }
  }

  return { post: res.data, shop };
}

/**
 * 浏览量+1
 */
async function incViewCount(params) {
  const { postId } = params;
  if (!postId) {
    return { errCode: 1, errMsg: "缺少笔记ID" };
  }

  await db.collection("posts").doc(postId).update({
    data: {
      view_count: _.inc(1)
    }
  });

  return { success: true };
}

exports.main = async (event, context) => {
  const { action } = event;

  switch (action) {
    case "list":
      return await listPosts(event);
    case "detail":
      return await getPostDetail(event);
    case "view":
      return await incViewCount(event);
    default:
      return { errCode: 400, errMsg: "Unknown action: " + action };
  }
};
