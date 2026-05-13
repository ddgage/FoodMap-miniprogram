// Cloud function HTTP endpoint
// 部署后替换为实际云函数 HTTP 触发器地址
const CLOUD_FUNCTION_URL = 'https://your-env.ap-shanghai.tcloudbase.com/admin';

// Admin token
const ADMIN_TOKEN = 'foodmap-admin-2024-secret';

const TOKEN_KEY = '_foodmap_admin_token';
const MOCK_KEY = '_foodmap_mock_data';

// ---- Mock data store ----
function getMockDB() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY)) || initMockDB();
  } catch {
    return initMockDB();
  }
}

function saveMockDB(db) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(db));
}

function initMockDB() {
  const db = {
    shops: [
      {
        _id: 's1',
        name: '海底捞火锅(湖滨银泰店)',
        category: '火锅',
        address: '延安路258号湖滨银泰in77 C区3楼',
        location: { lng: 120.1623, lat: 30.2518 },
        phone: '0571-86938888',
        rating: 4.8,
        avg_price: 130,
        photos: [],
        meituan_url: 'https://meituan.com/xxx',
        status: 'active',
        created_at: new Date('2025-05-01').toISOString()
      },
      {
        _id: 's2',
        name: '竹哩日本料理',
        category: '日料',
        address: '武林路163号2楼',
        location: { lng: 120.1638, lat: 30.2589 },
        phone: '0571-85109999',
        rating: 4.6,
        avg_price: 280,
        photos: [],
        meituan_url: 'https://meituan.com/yyy',
        status: 'active',
        created_at: new Date('2025-05-03').toISOString()
      },
      {
        _id: 's3',
        name: '木屋烧烤(凤起路店)',
        category: '烧烤',
        address: '凤起路333号',
        location: { lng: 120.1685, lat: 30.2612 },
        phone: '0571-88991111',
        rating: 4.4,
        avg_price: 85,
        photos: [],
        meituan_url: 'https://meituan.com/zzz',
        status: 'active',
        created_at: new Date('2025-05-05').toISOString()
      },
      {
        _id: 's4',
        name: 'M Stand咖啡(嘉里中心店)',
        category: '咖啡',
        address: '武林街道庆春路268号嘉里中心1楼',
        location: { lng: 120.165, lat: 30.2605 },
        phone: '0571-87239999',
        rating: 4.5,
        avg_price: 38,
        photos: [],
        meituan_url: '',
        status: 'active',
        created_at: new Date('2025-05-07').toISOString()
      },
      {
        _id: 's5',
        name: '满记甜品(西湖银泰店)',
        category: '甜品',
        address: '延安路98号西湖银泰B1',
        location: { lng: 120.1605, lat: 30.2445 },
        phone: '0571-86776666',
        rating: 4.3,
        avg_price: 45,
        photos: [],
        meituan_url: '',
        status: 'offline',
        created_at: new Date('2025-05-10').toISOString()
      }
    ],
    posts: [
      { _id: 'p1', title: '杭州最正宗的日料探店', fav_count: 128, view_count: 1560, status: 'published', created_at: new Date('2025-05-08').toISOString() },
      { _id: 'p2', title: '湖滨银泰美食合集', fav_count: 96, view_count: 2340, status: 'published', created_at: new Date('2025-05-09').toISOString() },
      { _id: 'p3', title: '西湖边的宝藏咖啡店', fav_count: 75, view_count: 890, status: 'published', created_at: new Date('2025-05-10').toISOString() },
      { _id: 'p4', title: '人均50吃到撑的烧烤', fav_count: 62, view_count: 1120, status: 'published', created_at: new Date('2025-05-11').toISOString() },
      { _id: 'p5', title: '杭州火锅地图之城南篇', fav_count: 53, view_count: 670, status: 'published', created_at: new Date('2025-05-12').toISOString() }
    ],
    users: [
      { _id: 'u1', nickname: '美食达人小王', openid: 'oxxx1', status: 'active', last_login_at: new Date('2025-05-12').toISOString(), created_at: new Date('2025-05-01').toISOString() },
      { _id: 'u2', nickname: '吃货小红', openid: 'oxxx2', status: 'active', last_login_at: new Date('2025-05-12').toISOString(), created_at: new Date('2025-05-02').toISOString() },
      { _id: 'u3', nickname: '爱吃的小明', openid: 'oxxx3', status: 'active', last_login_at: new Date('2025-05-11').toISOString(), created_at: new Date('2025-05-05').toISOString() },
      { _id: 'u4', nickname: '美食博主阿强', openid: 'oxxx4', status: 'banned', last_login_at: new Date('2025-05-08').toISOString(), created_at: new Date('2025-05-06').toISOString() }
    ],
    browse_history: [
      { created_at: new Date('2025-05-12').toISOString() },
      { created_at: new Date('2025-05-12').toISOString() },
      { created_at: new Date('2025-05-12').toISOString() },
      { created_at: new Date('2025-05-11').toISOString() },
      { created_at: new Date('2025-05-11').toISOString() },
      { created_at: new Date('2025-05-10').toISOString() },
      { created_at: new Date('2025-05-09').toISOString() },
      { created_at: new Date('2025-05-08').toISOString() },
      { created_at: new Date('2025-05-07').toISOString() },
      { created_at: new Date('2025-05-06').toISOString() }
    ],
    categories: [
      { _id: 'c1', name: '火锅', icon: '', sort_order: 1, status: 'active' },
      { _id: 'c2', name: '日料', icon: '', sort_order: 2, status: 'active' },
      { _id: 'c3', name: '烧烤', icon: '', sort_order: 3, status: 'active' },
      { _id: 'c4', name: '咖啡', icon: '', sort_order: 4, status: 'active' },
      { _id: 'c5', name: '甜品', icon: '', sort_order: 5, status: 'active' },
      { _id: 'c6', name: '川菜', icon: '', sort_order: 6, status: 'active' },
      { _id: 'c7', name: '粤菜', icon: '', sort_order: 7, status: 'active' },
      { _id: 'c8', name: '西餐', icon: '', sort_order: 8, status: 'active' },
      { _id: 'c9', name: '小吃', icon: '', sort_order: 9, status: 'active' }
    ]
  };
  saveMockDB(db);
  return db;
}

// ---- Mock handlers ----

function mockStats() {
  const db = getMockDB();
  const shopCount = db.shops.filter(s => s.status === 'active').length;
  const postCount = db.posts.filter(p => p.status === 'published').length;
  const userCount = db.users.length;
  const todayViews = db.posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  return { shopCount, postCount, userCount, todayViews };
}

function mockTrend() {
  const db = getMockDB();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = db.browse_history.filter(h => {
      const t = new Date(h.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    result.push({ date: dateStr, count });
  }
  return result;
}

function mockHotFavs() {
  const db = getMockDB();
  return db.posts
    .filter(p => p.status === 'published')
    .sort((a, b) => b.fav_count - a.fav_count)
    .slice(0, 10)
    .map(p => ({ _id: p._id, title: p.title, fav_count: p.fav_count }));
}

function mockListShops(params) {
  const db = getMockDB();
  let list = [...db.shops];
  const { keyword, category, status } = params || {};
  if (keyword) list = list.filter(s => s.name.includes(keyword));
  if (category) list = list.filter(s => s.category === category);
  if (status) list = list.filter(s => s.status === status);
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const paged = list.slice((page - 1) * pageSize, page * pageSize);
  return { list: paged, total, page, pageSize };
}

function mockGetShop(id) {
  const db = getMockDB();
  return db.shops.find(s => s._id === id);
}

function mockCreateShop(data) {
  const db = getMockDB();
  const shop = {
    _id: 's' + Date.now(),
    ...data,
    location: data.latitude && data.longitude ? { lng: data.longitude, lat: data.latitude } : null,
    created_at: new Date().toISOString()
  };
  db.shops.unshift(shop);
  saveMockDB(db);
  return shop;
}

function mockUpdateShop(id, data) {
  const db = getMockDB();
  const idx = db.shops.findIndex(s => s._id === id);
  if (idx < 0) return null;
  const updated = { ...db.shops[idx], ...data };
  if (data.latitude !== undefined && data.longitude !== undefined) {
    updated.location = { lng: data.longitude, lat: data.latitude };
  }
  delete updated.latitude;
  delete updated.longitude;
  db.shops[idx] = updated;
  saveMockDB(db);
  return updated;
}

function mockDeleteShop(id) {
  const db = getMockDB();
  db.shops = db.shops.filter(s => s._id !== id);
  saveMockDB(db);
  return { success: true };
}

function mockToggleShopStatus(id) {
  const db = getMockDB();
  const idx = db.shops.findIndex(s => s._id === id);
  if (idx < 0) return null;
  db.shops[idx].status = db.shops[idx].status === 'active' ? 'offline' : 'active';
  saveMockDB(db);
  return { status: db.shops[idx].status };
}

function mockListCategories() {
  return getMockDB().categories.filter(c => c.status === 'active');
}

// ---- Token management ----
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---- Call cloud function ----
async function callAdmin(action, data = {}) {
  // 如果配置了云函数地址，则尝试调用真实云函数
  const token = getToken();
  if (CLOUD_FUNCTION_URL && !CLOUD_FUNCTION_URL.includes('your-env')) {
    try {
      const res = await fetch(`${CLOUD_FUNCTION_URL}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.code === 0) return json.data;
      throw new Error(json.msg || '请求失败');
    } catch (e) {
      console.warn('Cloud function call failed, falling back to mock:', e.message);
    }
  }

  // Mock fallback
  return mockCall(action, data);
}

function mockCall(action, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        let result;
        switch (action) {
          case 'checkAuth': result = { valid: true }; break;
          case 'stats': result = mockStats(); break;
          case 'trend': result = mockTrend(); break;
          case 'hotFavs': result = mockHotFavs(); break;
          case 'listShops': result = mockListShops(data); break;
          case 'getShop': result = mockGetShop(data.id); break;
          case 'createShop': result = mockCreateShop(data); break;
          case 'updateShop': result = mockUpdateShop(data.id, data); break;
          case 'deleteShop': result = mockDeleteShop(data.id); break;
          case 'toggleShopStatus': result = mockToggleShopStatus(data.id); break;
          case 'listCategories': result = mockListCategories(); break;
          default: throw new Error('Unknown action: ' + action);
        }
        resolve(result);
      } catch (e) {
        resolve({ error: e.message });
      }
    }, 200 + Math.random() * 200);
  });
}

// ---- Exported API ----
export function checkAuth(token) {
  setToken(token);
  return callAdmin('checkAuth');
}

export function getStats() {
  return callAdmin('stats');
}

export function getTrend() {
  return callAdmin('trend');
}

export function getHotFavs() {
  return callAdmin('hotFavs');
}

export function listShops(params) {
  return callAdmin('listShops', params);
}

export function getShop(id) {
  return callAdmin('getShop', { id });
}

export function createShop(data) {
  return callAdmin('createShop', data);
}

export function updateShop(id, data) {
  return callAdmin('updateShop', { id, ...data });
}

export function deleteShop(id) {
  return callAdmin('deleteShop', { id });
}

export function toggleShopStatus(id) {
  return callAdmin('toggleShopStatus', { id });
}

export function listCategories() {
  return callAdmin('listCategories');
}
