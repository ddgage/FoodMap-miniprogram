const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 微信登录（含封禁校验）
 */
async function login(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { errCode: 1, errMsg: "获取openid失败" };
  }

  const { nickname, avatarUrl } = params;

  // 查找已有用户
  const existRes = await db.collection("users").where({ openid }).get();
  const now = new Date();

  if (existRes.data.length > 0) {
    const user = existRes.data[0];

    // 检查封禁状态
    if (user.status === "banned") {
      return { errCode: 403, errMsg: "账号已被限制使用" };
    }

    // 更新登录时间和资料
    const updateData = { last_login_at: now };
    if (nickname) updateData.nickname = nickname;
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    await db.collection("users").doc(user._id).update({ data: updateData });

    return { user: { ...user, ...updateData } };
  }

  // 新用户注册
  const newUser = {
    openid,
    nickname: nickname || "美食爱好者",
    avatar_url: avatarUrl || "",
    status: "active",
    last_login_at: now,
    created_at: now
  };

  const addRes = await db.collection("users").add({ data: newUser });
  return { user: { ...newUser, _id: addRes._id } };
}

/**
 * 更新用户资料
 */
async function updateProfile(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { nickname, avatarUrl } = params;
  const updateData = {};
  if (nickname !== undefined) updateData.nickname = nickname;
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

  if (Object.keys(updateData).length === 0) {
    return { errCode: 1, errMsg: "无更新内容" };
  }

  await db.collection("users").where({ openid }).update({ data: updateData });

  return { success: true };
}

/**
 * 检查登录状态
 */
async function checkLogin(params) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { user: null };
  }

  const res = await db.collection("users").where({ openid }).get();
  if (res.data.length === 0) {
    return { user: null };
  }

  return { user: res.data[0] };
}

exports.main = async (event, context) => {
  const { action } = event;

  switch (action) {
    case "login":
      return await login(event);
    case "updateProfile":
      return await updateProfile(event);
    case "checkLogin":
      return await checkLogin(event);
    default:
      return { errCode: 400, errMsg: "Unknown action: " + action };
  }
};
