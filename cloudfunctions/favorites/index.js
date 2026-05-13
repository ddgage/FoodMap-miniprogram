const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 收藏/取消收藏
 */
async function toggleFav(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { postId } = params;

  if (!postId) {
    return { errCode: 1, errMsg: "缺少笔记ID" };
  }

  // 查找是否已收藏
  const existRes = await db.collection("favorites").where({
    user_id: openid,
    post_id: postId
  }).get();

  if (existRes.data.length > 0) {
    // 取消收藏
    await db.collection("favorites").doc(existRes.data[0]._id).remove();
    // 收藏数-1
    await db.collection("posts").doc(postId).update({
      data: { fav_count: _.inc(-1) }
    });
    return { favorited: false };
  } else {
    // 添加收藏
    await db.collection("favorites").add({
      data: {
        user_id: openid,
        post_id: postId,
        created_at: new Date()
      }
    });
    // 收藏数+1
    await db.collection("posts").doc(postId).update({
      data: { fav_count: _.inc(1) }
    });
    return { favorited: true };
  }
}

/**
 * 收藏列表
 */
async function favList(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { page = 1, pageSize = 20 } = params;

  const totalResult = await db.collection("favorites")
    .where({ user_id: openid })
    .count();

  const favRes = await db.collection("favorites")
    .where({ user_id: openid })
    .orderBy("created_at", "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  // 获取关联的帖子详情
  const postIds = favRes.data.map(f => f.post_id);
  let posts = [];
  if (postIds.length > 0) {
    const postRes = await db.collection("posts").where({
      _id: _.in(postIds)
    }).get();
    posts = postRes.data;
  }

  return {
    favorites: favRes.data,
    posts,
    total: totalResult.total,
    hasMore: page * pageSize < totalResult.total
  };
}

/**
 * 添加浏览历史
 */
async function addHistory(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { postId } = params;

  if (!postId) {
    return { errCode: 1, errMsg: "缺少笔记ID" };
  }

  await db.collection("browse_history").add({
    data: {
      user_id: openid,
      post_id: postId,
      created_at: new Date()
    }
  });

  return { success: true };
}

/**
 * 浏览历史列表
 */
async function historyList(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { page = 1, pageSize = 20 } = params;

  const totalResult = await db.collection("browse_history")
    .where({ user_id: openid })
    .count();

  const historyRes = await db.collection("browse_history")
    .where({ user_id: openid })
    .orderBy("created_at", "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  // 获取关联的帖子详情
  const postIds = [...new Set(historyRes.data.map(h => h.post_id))];
  let posts = [];
  if (postIds.length > 0) {
    const postRes = await db.collection("posts").where({
      _id: _.in(postIds)
    }).get();
    posts = postRes.data;
  }

  return {
    history: historyRes.data,
    posts,
    total: totalResult.total,
    hasMore: page * pageSize < totalResult.total
  };
}

exports.main = async (event, context) => {
  const { action } = event;

  switch (action) {
    case "toggle":
      return await toggleFav(event);
    case "list":
      return await favList(event);
    case "addHistory":
      return await addHistory(event);
    case "history":
      return await historyList(event);
    default:
      return { errCode: 400, errMsg: "Unknown action: " + action };
  }
};
