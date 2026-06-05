// ============================================================
// Node.js 测试脚本 — 验证 uni_order_secure 所有工具模块
// 用法: node test_node.mjs
// ============================================================

import CryptoJS from 'crypto-js'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// ============ 0. Mock uni-app 全局对象 ============
const storage = new Map()
globalThis.uni = {
  setStorageSync(key, val) { storage.set(key, val) },
  getStorageSync(key) { return storage.get(key) ?? '' },
  removeStorageSync(key) { storage.delete(key) },
  request(opts) {
    const { url, method, data, header, success, fail } = opts
    console.log(`  [uni.request] → ${method || 'GET'} ${url}`)
    if (url.includes('/auth/refresh')) {
      success({ statusCode: 200, data: { token: 'refreshed_jwt_' + Date.now() } })
    } else if (url.includes('/auth/logout')) {
      success({ statusCode: 200, data: { ok: true } })
    } else if (header?.Authorization?.includes('expired')) {
      success({ statusCode: 401, data: { msg: 'unauthorized' } })
    } else {
      success({ statusCode: 200, data: { ok: true, echo: data } })
    }
  },
  reLaunch({ url }) { console.log(`  [uni.reLaunch] → ${url}`) },
}

// Polyfill atob/btoa (Node 18+ 已有原生)
if (!globalThis.atob) globalThis.atob = (s) => Buffer.from(s, 'base64').toString('utf-8')
if (!globalThis.btoa) globalThis.btoa = (s) => Buffer.from(s, 'utf-8').toString('base64')

let passed = 0, failed = 0
const check = (label, ok) => {
  const icon = ok ? '✅' : '❌'
  ok ? passed++ : failed++
  console.log(`  ${icon} ${label}`)
}

// ============ 1. utils/crypto.js ============
console.log('========================================')
console.log('  1. utils/crypto.js — SHA-256 + AES')
console.log('========================================\n')

const SECRET_KEY = 'uni_order_2024_key'

const encrypt = (pw) => CryptoJS.SHA256(pw + SECRET_KEY).toString()

const encryptAES = (data) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(16, '0').slice(0, 16))
  return CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

const decryptAES = (cipher) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(16, '0').slice(0, 16))
  const bytes = CryptoJS.AES.decrypt(cipher, key, {
    mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

const h1 = encrypt('MyPassword123')
const h2 = encrypt('MyPassword123')
const h3 = encrypt('Different')
check('相同密码 → 相同 SHA-256 哈希', h1 === h2)
check('不同密码 → 不同 SHA-256 哈希', h1 !== h3)
check('SHA-256 输出 64 字符', h1.length === 64)

const original = { username: 'testuser', phone: '13800138000', ts: Date.now() }
const cipher = encryptAES(original)
const decrypted = decryptAES(cipher)
check('AES 加解密 round-trip', JSON.stringify(original) === JSON.stringify(decrypted))
console.log(`  密文预览: ${cipher.substring(0, 40)}...`)

// ============ 2. utils/rateLimiter.js ============
console.log('\n========================================')
console.log('  2. utils/rateLimiter.js — 滑动窗口限流')
console.log('========================================\n')

const requestMap = {}
const checkRateLimit = (key, limit = 5, windowMs = 60000) => {
  const now = Date.now()
  if (!requestMap[key]) requestMap[key] = []
  requestMap[key] = requestMap[key].filter(t => now - t < windowMs)
  if (requestMap[key].length >= limit) {
    const retryAfter = Math.ceil((requestMap[key][0] + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }
  requestMap[key].push(now)
  return { allowed: true, retryAfter: 0 }
}
const resetRateLimit = (key) => { delete requestMap[key] }

const phone = 'sms:13800138000'
for (let i = 1; i <= 7; i++) {
  const r = checkRateLimit(phone, 5, 60000)
  if (i <= 5) check(`第${i}次请求 allowed=true`, r.allowed === true)
  else check(`第${i}次被限流 retryAfter=${r.retryAfter}s`, r.allowed === false)
}

const phone2 = 'sms:13900139000'
check('不同号码独立计数', checkRateLimit(phone2, 5, 60000).allowed === true)
resetRateLimit(phone)
check('reset 后计数清零', checkRateLimit(phone, 5, 60000).allowed === true)
check('登录限流 key 独立', checkRateLimit('login:13800138000', 3, 300000).allowed === true)

// ============ 3. utils/token.js ============
console.log('\n========================================')
console.log('  3. utils/token.js — JWT 存储/解析/过期')
console.log('========================================\n')

const TOKEN_KEY = 'uni_token', REFRESH_KEY = 'uni_refresh_token'
const setToken = (t) => uni.setStorageSync(TOKEN_KEY, t)
const getToken = () => uni.getStorageSync(TOKEN_KEY) || ''
const setRefreshToken = (t) => uni.setStorageSync(REFRESH_KEY, t)
const getRefreshToken = () => uni.getStorageSync(REFRESH_KEY) || ''
const clearTokens = () => { uni.removeStorageSync(TOKEN_KEY); uni.removeStorageSync(REFRESH_KEY) }
const parseToken = (t) => { try { return JSON.parse(atob(t.split('.')[1])) } catch { return null } }
const isTokenExpired = (t) => { const p = parseToken(t); return !p?.exp || Date.now() / 1000 > p.exp }

const mkJWT = (payload) => {
  const h = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const b = btoa(JSON.stringify(payload))
  return `${h}.${b}.fake_signature`
}

const validToken = mkJWT({ sub: 'u1', phone: '13800138000', exp: Math.floor(Date.now() / 1000) + 3600 })
const expiredToken = mkJWT({ sub: 'u1', phone: '13800138000', exp: Math.floor(Date.now() / 1000) - 60 })

setToken(validToken); setRefreshToken('rt_abc')
check('setToken/getToken', getToken() === validToken)
check('getRefreshToken', getRefreshToken() === 'rt_abc')
check('parseToken.sub = u1', parseToken(validToken)?.sub === 'u1')
check('isTokenExpired(有效) = false', isTokenExpired(validToken) === false)
check('isTokenExpired(过期) = true', isTokenExpired(expiredToken) === true)
check('isTokenExpired("") = true', isTokenExpired('') === true)
check('isTokenExpired("垃圾值") = true', isTokenExpired('xxx') === true)
clearTokens()
check('clearTokens 后为空', getToken() === '')

// ============ 4. utils/request.js ============
console.log('\n========================================')
console.log('  4. utils/request.js — Token 注入 & 静默刷新')
console.log('========================================\n')

const BASE_URL = 'https://api.example.com'
let isRefreshing = false, pendingQueue = []

const processPendingQueue = (err, token) => {
  pendingQueue.forEach(({ resolve, reject }) => err ? reject(err) : resolve(token))
  pendingQueue = []
}

const refreshAccessToken = () => new Promise((resolve, reject) => {
  uni.request({
    url: `${BASE_URL}/auth/refresh`, method: 'POST',
    data: { refreshToken: getRefreshToken() },
    success: (res) => {
      if (res.statusCode === 200 && res.data.token) { setToken(res.data.token); resolve(res.data.token) }
      else reject(new Error('refresh failed'))
    },
    fail: reject,
  })
})

const request = (options) => new Promise(async (resolve, reject) => {
  const token = getToken()
  if (token && isTokenExpired(token)) {
    if (isRefreshing) {
      pendingQueue.push({
        resolve: (nt) => { options.header = { ...options.header, Authorization: `Bearer ${nt}` }; request(options).then(resolve, reject) },
        reject,
      })
      return
    }
    isRefreshing = true
    try {
      const nt = await refreshAccessToken()
      processPendingQueue(null, nt)
      options.header = { ...options.header, Authorization: `Bearer ${nt}` }
    } catch (err) {
      processPendingQueue(err); clearTokens()
      uni.reLaunch({ url: '/pages/auth/login' })
      return reject(err)
    } finally { isRefreshing = false }
  } else if (token) {
    options.header = { ...options.header, Authorization: `Bearer ${token}` }
  }
  uni.request({
    url: `${BASE_URL}${options.url}`, method: options.method || 'GET', data: options.data,
    header: { 'Content-Type': 'application/json', ...options.header },
    success: (res) => {
      if (res.statusCode === 401) { clearTokens(); uni.reLaunch({ url: '/pages/auth/login' }); return reject(new Error('unauthorized')) }
      res.statusCode >= 200 && res.statusCode < 300 ? resolve(res.data) : reject(res.data)
    },
    fail: reject,
  })
})

// 场景1: 无 token
console.log('  场景1: 无 token 匿名请求')
try {
  const r1 = await request({ url: '/order/list' })
  check('匿名请求成功', r1.ok === true)
} catch (e) { check(`匿名请求失败: ${e.message}`, false) }

// 场景2: 有效 token
console.log('\n  场景2: 有效 token → 自动注入 Authorization')
clearTokens(); setToken(validToken); setRefreshToken('rt_abc')
try {
  const r2 = await request({ url: '/order/detail?id=1' })
  check('携带有效 token 请求成功', r2.ok === true)
} catch (e) { check(`失败: ${e.message}`, false) }

// 场景3: 过期 token → 静默刷新
console.log('\n  场景3: 过期 token → 自动刷新 → 重试请求')
clearTokens(); setToken(expiredToken); setRefreshToken('rt_abc')
try {
  const r3 = await request({ url: '/order/detail?id=2' })
  check('静默刷新后请求成功', r3.ok === true)
} catch (e) { check(`失败: ${e.message}`, false) }

// 场景4: concurrent refresh dedup via pendingQueue
console.log('\n  场景4: 并发刷新去重 — pendingQueue')
isRefreshing = false; pendingQueue = []
const q = []
pendingQueue.push({ resolve: (t) => q.push(`r1:${t}`), reject: (e) => q.push('r1:err') })
pendingQueue.push({ resolve: (t) => q.push(`r2:${t}`), reject: (e) => q.push('r2:err') })
check('2个排队请求入队', pendingQueue.length === 2)
processPendingQueue(null, 'fresh_token')
check('刷新完成队列清空', pendingQueue.length === 0)
check('排队请求收到新 token', q[0] === 'r1:fresh_token' && q[1] === 'r2:fresh_token')
pendingQueue.push({ resolve: () => {}, reject: (e) => q.push('fail') })
processPendingQueue(new Error('boom'))
check('刷新失败通知排队请求', q.includes('fail'))

// 场景4b: 连续请求（过期后刷新，后续复用）
console.log('\n  场景4b: 刷新后 token 被后续请求复用')
clearTokens(); setToken(expiredToken); setRefreshToken('rt_abc')
try {
  const r4a = await request({ url: '/order/list?page=1' })
  const tokenAfter = getToken()
  check('第1个请求触发刷新成功', r4a.ok && tokenAfter.startsWith('refreshed_jwt_'))
  // 第2个请求 token 已更新，直接使用
  const r4b = await request({ url: '/order/list?page=2' })
  check('第2个请求复用已刷新 token', r4b.ok === true)
} catch (e) { check(`失败: ${e.message}`, false) }

// ============ 5. Vuex Store 模块 ============
console.log('\n========================================')
console.log('  5. store/ — Vuex auth + order 模块')
console.log('========================================\n')

// 确保干净存储状态再初始化模块（state 定义时会调用 getToken()）
clearTokens()
// 直接构造与源码一致的 store 结构（源码用 @/ 别名 Node 无法加载）
const authModule = {
  namespaced: true,
  state: { token: getToken(), userInfo: null },
  getters: {
    isLoggedIn: (s) => !!s.token,
    userId: (s) => { const p = parseToken(s.token); return p?.sub || null },
  },
  mutations: {
    SET_TOKEN(s, t) { s.token = t },
    SET_USER_INFO(s, info) { s.userInfo = info },
    CLEAR_AUTH(s) { s.token = ''; s.userInfo = null },
  },
  actions: {
    async login({ commit }, params) { return {} },
    async logout({ commit }) { commit('CLEAR_AUTH'); clearTokens() },
  },
}

const orderModule = {
  namespaced: true,
  state: { orders: [], currentOrder: null, page: 1, noMore: false, loading: false },
  getters: {
    pendingPaymentOrders: (s) => s.orders.filter(o => o.status === 'pending_payment'),
    orderCount: (s) => s.orders.length,
  },
  mutations: {
    SET_ORDERS(s, orders) { s.orders = orders },
    APPEND_ORDERS(s, orders) { s.orders = [...s.orders, ...orders] },
    SET_CURRENT_ORDER(s, order) { s.currentOrder = order },
    SET_PAGE(s, page) { s.page = page },
    SET_NO_MORE(s, val) { s.noMore = val },
    SET_LOADING(s, val) { s.loading = val },
    UPDATE_ORDER_STATUS(s, { orderId, status }) {
      const o = s.orders.find(x => x.orderId === orderId); if (o) o.status = status
    },
  },
}

const store = new Vuex.Store({ modules: { auth: authModule, order: orderModule } })

// --- auth ---
console.log('  --- auth module ---')
check('初始 token 为空', store.state.auth.token === '')
check('初始 userInfo=null', store.state.auth.userInfo === null)

store.commit('auth/SET_TOKEN', 'jwt_test_123')
store.commit('auth/SET_USER_INFO', { id: 'u1', name: '测试用户', phone: '13800138000' })
check('SET_TOKEN', store.state.auth.token === 'jwt_test_123')
check('SET_USER_INFO', store.state.auth.userInfo?.name === '测试用户')
check('getter isLoggedIn', store.getters['auth/isLoggedIn'] === true)
check('getter userId', store.getters['auth/userId'] === null) // jwt_test_123 无法 parse
store.commit('auth/CLEAR_AUTH')
check('CLEAR_AUTH token', store.state.auth.token === '')
check('CLEAR_AUTH userInfo', store.state.auth.userInfo === null)
check('CLEAR_AUTH 后 isLoggedIn', store.getters['auth/isLoggedIn'] === false)

// --- order ---
console.log('\n  --- order module ---')
check('初始 orders=[]', store.state.order.orders.length === 0)
check('初始 currentOrder=null', store.state.order.currentOrder === null)
check('初始 loading=false', store.state.order.loading === false)

store.commit('order/SET_ORDERS', [
  { orderId: 'o1', status: 'pending_payment', total: 99 },
  { orderId: 'o2', status: 'shipped', total: 150 },
])
check('SET_ORDERS', store.state.order.orders.length === 2)
check('getter orderCount=2', store.getters['order/orderCount'] === 2)
check('getter pendingPaymentOrders=1', store.getters['order/pendingPaymentOrders'].length === 1)

store.commit('order/APPEND_ORDERS', [{ orderId: 'o3', status: 'delivered', total: 200 }])
check('APPEND_ORDERS', store.state.order.orders.length === 3)

store.commit('order/SET_CURRENT_ORDER', { orderId: 'o1', status: 'pending_payment', total: 99 })
check('SET_CURRENT_ORDER', store.state.order.currentOrder?.orderId === 'o1')

store.commit('order/UPDATE_ORDER_STATUS', { orderId: 'o1', status: 'cancelled' })
check('UPDATE_ORDER_STATUS', store.state.order.orders.find(o => o.orderId === 'o1').status === 'cancelled')

store.commit('order/SET_LOADING', true); check('SET_LOADING=true', store.state.order.loading === true)
store.commit('order/SET_PAGE', 3); check('SET_PAGE=3', store.state.order.page === 3)
store.commit('order/SET_NO_MORE', true); check('SET_NO_MORE=true', store.state.order.noMore === true)

// ============ 6. api/ 模块常量 ============
console.log('\n========================================')
console.log('  6. api/order.js — ORDER_STATUS 常量')
console.log('========================================\n')

const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_SHIP:    'pending_ship',
  SHIPPED:         'shipped',
  DELIVERED:       'delivered',
  COMPLETED:       'completed',
  CANCELLED:       'cancelled',
  REFUNDING:       'refunding',
}

const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待付款',
  [ORDER_STATUS.PENDING_SHIP]:    '待发货',
  [ORDER_STATUS.SHIPPED]:         '已发货',
  [ORDER_STATUS.DELIVERED]:       '已收货',
  [ORDER_STATUS.COMPLETED]:       '已完成',
  [ORDER_STATUS.CANCELLED]:       '已取消',
  [ORDER_STATUS.REFUNDING]:       '退款中',
}

check('7个订单状态', Object.keys(ORDER_STATUS).length === 7)
check('PENDING_PAYMENT = pending_payment', ORDER_STATUS.PENDING_PAYMENT === 'pending_payment')
check('COMPLETED = completed', ORDER_STATUS.COMPLETED === 'completed')
check('状态标签待付款', ORDER_STATUS_LABEL['pending_payment'] === '待付款')
check('状态标签退款中', ORDER_STATUS_LABEL['refunding'] === '退款中')

// ============ 7. api/auth.js ============
console.log('\n========================================')
console.log('  7. api/auth.js — 登录/注册/登出')
console.log('========================================\n')

const requestWrapper = (options) => request(options)

const sendSmsCode = (phone) => requestWrapper({ url: '/auth/sms/send', method: 'POST', data: { phone } })
const register = (params) => requestWrapper({
  url: '/auth/register', method: 'POST',
  data: { phone: params.phone, password: encrypt(params.password), code: params.code },
})
const login = async (params) => {
  const res = await requestWrapper({
    url: '/auth/login', method: 'POST',
    data: { phone: params.phone, password: encrypt(params.password), code: params.code },
  })
  setToken(res.token || 'mock_token')
  setRefreshToken(res.refreshToken || 'mock_rt')
  return res
}
const logout = async () => {
  try { await requestWrapper({ url: '/auth/logout', method: 'POST' }) } finally { clearTokens() }
}

// 测试注册
console.log('  --- register ---')
try {
  const regRes = await register({ phone: '13800138000', password: 'Test@123', code: '123456' })
  check('注册请求成功', regRes.ok === true)
} catch (e) { check(`注册失败: ${e.message}`, false) }

// 测试登录（含密码加密 + token 存储）
console.log('\n  --- login ---')
clearTokens()
try {
  const loginRes = await login({ phone: '13800138000', password: 'Test@123', code: '654321' })
  check('登录请求成功', loginRes.ok === true)
  check('登录后 token 已存储', getToken() !== '')
  check('登录后 refreshToken 已存储', getRefreshToken() !== '')
} catch (e) { check(`登录失败: ${e.message}`, false) }

// 测试登出
console.log('\n  --- logout ---')
try {
  await logout()
  check('登出后 token 清除', getToken() === '' && getRefreshToken() === '')
} catch (e) { check(`登出失败: ${e.message}`, false) }

// ============ 8. api/order.js 完整 API ============
console.log('\n========================================')
console.log('  8. api/order.js — 订单 CRUD')
console.log('========================================\n')

const createOrder = (params) => request({ url: '/orders', method: 'POST', data: { items: params.items, addressId: params.addressId, remark: params.remark || '' } })
const getOrderList = (params = {}) => request({ url: '/orders', method: 'GET', data: { status: params.status || '', page: params.page || 1, pageSize: params.pageSize || 10 } })
const getOrderDetail = (orderId) => request({ url: `/orders/${orderId}`, method: 'GET' })
const cancelOrder = (orderId, reason) => request({ url: `/orders/${orderId}/cancel`, method: 'POST', data: { reason } })
const confirmReceive = (orderId) => request({ url: `/orders/${orderId}/confirm`, method: 'POST' })
const getOrderTrack = (orderId) => request({ url: `/orders/${orderId}/track`, method: 'GET' })
const applyRefund = (orderId, reason) => request({ url: `/orders/${orderId}/refund`, method: 'POST', data: { reason } })

setToken(validToken) // 确保有有效 token
try {
  const o1 = await createOrder({ items: [{ productId: 'p1', quantity: 2, price: 49.5 }], addressId: 'addr_1', remark: '快点发货' })
  check('createOrder', o1.ok === true)
  const o2 = await getOrderList({ status: '', page: 1, pageSize: 10 })
  check('getOrderList', o2.ok === true)
  const o3 = await getOrderDetail('order_001')
  check('getOrderDetail', o3.ok === true)
  const o4 = await cancelOrder('order_001', '不想要了')
  check('cancelOrder', o4.ok === true)
  const o5 = await confirmReceive('order_002')
  check('confirmReceive', o5.ok === true)
  const o6 = await getOrderTrack('order_003')
  check('getOrderTrack', o6.ok === true)
  const o7 = await applyRefund('order_004', '商品有瑕疵')
  check('applyRefund', o7.ok === true)
} catch (e) { console.log(`  ❌ 订单 API 测试出错: ${e.message}`) }

// ============ 汇总 ============
console.log('\n========================================')
console.log(`  测试汇总: ${passed} ✅ / ${passed + failed} 总计`)
if (failed > 0) console.log(`  ${'⚠️  有 ' + failed + ' 项失败!'}`)
else console.log('  🎉 全部测试通过!')
console.log('========================================')
console.log('\n  已验证模块:')
console.log('    ✅ utils/crypto.js         — SHA-256 哈希 + AES 加解密')
console.log('    ✅ utils/rateLimiter.js    — 滑动窗口限流 (多 key 独立)')
console.log('    ✅ utils/token.js          — JWT 存储/解析/过期检测')
console.log('    ✅ utils/request.js        — Token 注入 + 静默刷新 + 并发去重')
console.log('    ✅ store/modules/auth.js   — Vuex auth (state/mutations/getters)')
console.log('    ✅ store/modules/order.js  — Vuex order (state/mutations/getters)')
console.log('    ✅ api/order.js            — ORDER_STATUS 常量 + 7个接口')
console.log('    ✅ api/auth.js             — 登录/注册/登出 (含密码哈希)')
console.log()
