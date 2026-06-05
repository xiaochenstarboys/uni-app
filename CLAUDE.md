# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 uni-app（Vue 2）的跨平台小程序，核心模块：高安全性认证 + 订单管理系统。无真实后端，接口基址为占位符 `https://api.example.com`，项目定位为简历展示用途。

## 运行方式

### HBuilderX（正式编译）
需要 HBuilderX 打开项目，无 npm/node 构建步骤。`package.json` 中的脚本仅供参考，实际编译由 HBuilderX 或 uni-cli 完成。

### Node.js 测试（本地验证）
```bash
node test_node.mjs          # 69项测试，覆盖全部 utils/store/api 模块
```

### H5 前端演示（浏览器直接打开）
```bash
npx http-server . -p 8080 -o demo.html
```
`demo.html` 是完整单文件 H5 实现——CDN 加载 vue/vuex/crypto-js，mock 了 `uni.*` API，可直接在浏览器中跑完整登录→订单流程。无构建步骤。

`@dcloudio/uni-app` 不在公共 npm，如只需安装可用的依赖：
```bash
npm install crypto-js vue vuex
```

## 架构要点

### 请求链路
所有接口调用经过 `utils/request.js` 统一封装，自动完成：
- Token 注入（Bearer）
- 过期检测 → 静默刷新（`/auth/refresh`）
- 并发刷新去重（`isRefreshing` 锁 + `pendingQueue` 排队）
- 401 自动跳转登录页

### 安全层
- `utils/crypto.js`：密码上传前 SHA-256 哈希，AES 用于数据加密
- `utils/rateLimiter.js`：滑动窗口限流，按 key 独立计数（`sms:{phone}`、`login:{phone}`、`register:{phone}`）
- `utils/token.js`：JWT 本地存储与解析，不做签名验证（由服务端负责）

### 状态管理
Vuex 分两个命名空间模块：
- `auth`：登录态、token、userInfo
- `order`：订单列表分页、当前订单、加载状态

### 订单状态流
定义在 `api/order.js` 的 `ORDER_STATUS` 常量：
`pending_payment → pending_ship → shipped → delivered → completed`，支路：`cancelled`、`refunding`

## 关键约定

- 页面直接调用 `api/` 层，部分页面同时使用 Vuex action（`order/list.vue` 直接调 api，`store/modules/order.js` 也封装了相同调用——两者并存，勿重构合并）
- 限流 key 格式固定为 `动作:手机号`，修改时需同步 login.vue、register.vue
- `pages.json` 中首页必须是 `pages/index/index`（tabBar 入口），登录/注册页不在 tabBar 中
- 路径别名 `@/` 映射到项目根目录（uni-app 默认），源码中 `@/api/auth.js` 等 import 不能直接在 Node.js 里 resolve——`test_node.mjs` 和 `demo.html` 都用了内联实现绕过此限制
- `demo.html` 和 `test_node.mjs` 通过 mock `uni` 全局对象运行，与真实 uni-app 行为等价。修改 `utils/request.js` 的 token 刷新逻辑时，注意 mock 必须同时触发 `opts.success` 回调和 resolve Promise（真实 `uni.request` 两路都支持）
