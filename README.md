# uni-order-secure

基于 **uni-app** 框架开发的跨平台小程序，涵盖高安全性认证模块与完整订单管理系统。

## 功能亮点

### 安全认证模块
- **密码加密**：SHA-256 + 固定盐值哈希，密码明文不上传
- **SMS 验证码**：登录/注册双重校验，滑动窗口限流（60s 内限 1 次）
- **JWT 鉴权**：Token 自动注入请求头，过期前静默刷新（无感续期）
- **Token 刷新锁**：并发请求排队等待单次刷新，避免 race condition
- **前端限流**：`rateLimiter.js` 滑动窗口算法，对登录/注册/短信接口独立限速

### 订单管理系统
- **订单状态流转**：待付款 → 待发货 → 已发货 → 已收货 → 已完成，含取消/退款支路
- **订单轨迹**：时间线展示物流节点，最新节点高亮
- **分页加载**：下拉刷新 + 上拉加载更多（防重复请求）
- **Tab 筛选**：按状态分类查看订单列表

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | uni-app (Vue 2) |
| 状态管理 | Vuex（auth / order 模块） |
| 加密 | crypto-js（SHA-256 / AES） |
| 网络 | 封装 `uni.request`，支持 Token 自动刷新 |
| 限流 | 自实现滑动窗口限流器 |

## 目录结构

```
├── api/
│   ├── auth.js          # 登录、注册、短信验证码接口
│   └── order.js         # 订单 CRUD、轨迹、退款接口
├── utils/
│   ├── crypto.js        # SHA-256 密码哈希 + AES 加解密
│   ├── token.js         # JWT 存储、解析、过期检测
│   ├── request.js       # 统一请求封装（自动 Token 刷新）
│   └── rateLimiter.js   # 滑动窗口限流
├── store/
│   └── modules/
│       ├── auth.js      # 登录态管理
│       └── order.js     # 订单列表状态管理
├── pages/
│   ├── auth/            # 登录 / 注册页
│   ├── order/           # 订单列表 / 详情页
│   ├── index/           # 首页
│   └── user/            # 个人中心
└── components/
    └── OrderCard.vue    # 订单卡片组件（含操作按钮）
```

## 核心实现说明

### 无感 Token 刷新
```js
// utils/request.js
if (token && isTokenExpired(token)) {
  if (isRefreshing) {
    // 并发请求排队，等待唯一一次刷新完成
    pendingQueue.push({ resolve, reject })
    return
  }
  isRefreshing = true
  const newToken = await refreshAccessToken()
  processPendingQueue(null, newToken)
}
```

### 滑动窗口限流
```js
// utils/rateLimiter.js — 登录接口 60s 内限 5 次
const { allowed, retryAfter } = checkRateLimit(`login:${phone}`, 5, 60000)
if (!allowed) return uni.showToast({ title: `请 ${retryAfter}s 后重试` })
```
