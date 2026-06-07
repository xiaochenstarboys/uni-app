# uni-order-secure

基于 **uni-app**（Vue 2 Options API）框架开发的跨平台小程序，涵盖高安全性认证模块与完整订单管理系统。无真实后端，接口基址为占位符 `https://api.example.com`，项目定位为简历展示用途。

## 功能亮点

### 安全认证模块
- **密码加密**：SHA-256 + 固定盐值哈希，密码明文不上传
- **AES-CBC 加密**：随机 IV，数据加密存储（非 ECB 模式）
- **SMS 验证码**：登录/注册双重校验，滑动窗口限流（sms 60s 限 1 次、login 60s 限 5 次、register 60s 限 3 次）
- **JWT 鉴权**：Token 自动注入请求头，过期前静默刷新（无感续期）
- **Token 刷新锁**：并发请求排队等待单次刷新，避免 race condition
- **前端限流**：`rateLimiter.js` 滑动窗口算法，惰性清理过期 key 防内存泄漏

### 订单管理系统
- **订单状态流转**：待付款 → 待发货 → 已发货 → 已收货 → 已完成，含取消/退款支路
- **订单轨迹**：时间线展示物流节点，最新节点高亮
- **分页加载**：下拉刷新 + 上拉加载更多（防重复请求）
- **Tab 筛选**：按状态分类查看订单列表（客户端缓存，瞬时切换）
- **动态统计**：个人中心实时展示各状态订单数量

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | uni-app (Vue 2 Options API) |
| 状态管理 | Vuex（auth / order 命名空间模块） |
| 加密 | crypto-js（SHA-256 / AES-CBC） |
| 网络 | 封装 `uni.request`，支持 Token 自动刷新 + 超时 |
| 限流 | 自实现滑动窗口限流器（惰性清理） |
| 表单复用 | mixin `authForm.js`（验证码发送、倒计时、手机号校验） |
| 输入校验 | `utils/validator.js` 统一校验函数 |

## 目录结构

```
├── api/
│   ├── auth.js          # 登录、注册、短信验证码接口
│   └── order.js         # 订单 CRUD、轨迹、退款接口 + ORDER_STATUS 常量
├── utils/
│   ├── crypto.js        # SHA-256 密码哈希 + AES-CBC 加解密（随机 IV）
│   ├── token.js         # JWT 存储、解析、过期检测
│   ├── request.js       # 统一请求封装（自动 Token 刷新 + 超时 + 并发去重）
│   ├── rateLimiter.js   # 滑动窗口限流（惰性清理过期 key）
│   └── validator.js     # 统一输入校验（手机号、密码强度、验证码、订单ID）
├── mixins/
│   └── authForm.js      # 认证表单共享 mixin（SMS 发送、倒计时、验证逻辑）
├── store/
│   └── modules/
│       ├── auth.js      # 登录态管理
│       └── order.js     # 订单列表状态管理
├── pages/
│   ├── auth/            # 登录 / 注册页（使用 authForm mixin）
│   ├── order/           # 订单列表 / 详情页
│   ├── index/           # 首页
│   └── user/            # 个人中心（动态订单统计）
├── components/
│   └── OrderCard.vue    # 订单卡片组件（含操作按钮）
├── demo.html            # H5 单文件前端演示
├── test_node.mjs        # Node.js 69 项测试脚本
└── CLAUDE.md            # Claude Code 项目指南
```

## 核心实现说明

### AES-CBC 加密（随机 IV）
```js
// utils/crypto.js — AES-CBC，IV 拼接在密文头部
const iv = CryptoJS.lib.WordArray.random(16)
const encrypted = CryptoJS.AES.encrypt(data, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
return CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext))
```

### 无感 Token 刷新（无 Promise 反模式）
```js
// utils/request.js — async function，排队者 resolve(token) 而非递归调用
export const request = async (options) => {
  const token = getToken()
  if (token && isTokenExpired(token)) {
    if (isRefreshing) {
      const newToken = await new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
      options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
    } else {
      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        processPendingQueue(null, newToken)
        options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
      } finally { isRefreshing = false }
    }
  }
  // ... 发起请求（含 15s 超时）
}
```

### 滑动窗口限流（含内存泄漏防护）
```js
// utils/rateLimiter.js — 惰性清理窗口内无记录的 key
requestMap[key] = requestMap[key].filter(t => now - t < windowMs)
if (requestMap[key].length === 0) delete requestMap[key]  // 清理空记录
```

### 认证表单 Mixin 复用
```js
// mixins/authForm.js — 登录页和注册页共享
export default {
  methods: {
    validatePhone() { /* 引用 utils/validator.js */ },
    async handleSendCode() { /* SMS 发送 + 限流 + 60s 倒计时 */ },
    startCountdown(seconds) { /* 倒计时 timer 管理 */ },
  },
  onUnload() { clearInterval(this.timer) },
}
```

## 运行方式

### HBuilderX（正式编译）
需要 HBuilderX 打开项目，无 npm/node 构建步骤。

### Node.js 测试（本地验证）
```bash
node test_node.mjs          # 69 项测试，覆盖全部 utils/store/api 模块
```

### H5 前端演示
```bash
npx http-server . -p 8080 -o demo.html
```

```bash
npm install crypto-js vue vuex
```
