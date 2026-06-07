# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 uni-app（Vue 2 Options API）的跨平台小程序，核心模块：高安全性认证 + 订单管理系统。无真实后端，接口基址为占位符 `https://api.example.com`，项目定位为简历展示用途。

## 运行方式

### HBuilderX（正式编译）
需要 HBuilderX 打开项目，无 npm/node 构建步骤。`package.json` 中的脚本仅供参考（需要 `@dcloudio/uni-cli`，不在公共 npm），实际编译由 HBuilderX 或 uni-cli 完成。

### Node.js 测试（本地验证）
```bash
node test_node.mjs          # 69项测试，分8个模块全覆盖
```
测试模块结构：`crypto.js` → `rateLimiter.js` → `token.js` → `request.js` → Vuex store → ORDER_STATUS 常量 → `api/auth.js` → `api/order.js`。`test_node.mjs` 内联了所有模块代码（绕过 `@/` 别名限制），并 mock 了 `uni.*` API。修改源码模块时需同步更新 `test_node.mjs` 中对应的内联副本。

### H5 前端演示（浏览器直接打开）
```bash
npx http-server . -p 8080 -o demo.html
```
`demo.html` 是完整单文件 H5 实现——CDN 加载 vue/vuex/crypto-js，mock 了 `uni.*` API，可直接在浏览器中跑完整登录→订单流程。无构建步骤。与源码的关系：`demo.html` 是独立副本，修改源码不影响它，反之亦然。

`@dcloudio/uni-app` 不在公共 npm，如只需安装可用的依赖：
```bash
npm install crypto-js vue vuex
```

无 ESLint/Prettier 配置，无需运行 lint 命令。

## 页面路由与导航流

定义在 `pages.json`，含 tabBar（3 个入口）和全局样式：

```
pages/index/index      ← tabBar 首页（轮播+商品网格，onShow 检测 token）
pages/auth/login        ← 非 tabBar（登录→reLaunch 到首页）
pages/auth/register     ← 非 tabBar（注册成功→navigateBack）
pages/order/list        ← tabBar 订单列表（Tab 切换+下拉刷新+上拉加载）
pages/order/detail      ← 非 tabBar（从列表 card 点击进入，接收 ?orderId=）
pages/user/profile      ← tabBar 个人中心（统计区+退出登录）
```

关键导航规则：
- 登录/注册页不在 tabBar 中，通过 `uni.navigateTo`/`uni.navigateBack` 互相跳转
- 登录成功后 `uni.reLaunch('/pages/index/index')` — 清空页面栈
- 首页 `onShow` 和 `request.js` 401 均会 `reLaunch` 到登录页
- 退出登录调用 `api/auth.logout()`（fail-safe：finally 中清 token 并 reLaunch）

## 架构要点

### 请求链路
所有接口调用经过 `utils/request.js` 统一封装，自动完成：
- Token 注入（Bearer）
- 过期检测 → 静默刷新（`/auth/refresh`）
- 并发刷新去重（`isRefreshing` 锁 + `pendingQueue` 排队——过期瞬间多个请求只触发一次刷新，其余排队等待）
- 401 自动跳转登录页

### 安全层
- `utils/crypto.js`：密码上传前 SHA-256(密码+固定盐) 哈希，AES-ECB 用于数据加解密
- `utils/rateLimiter.js`：滑动窗口限流，按 key 独立计数。**实际限流参数**：
  - `sms:{phone}` — 60s 内限 1 次
  - `login:{phone}` — 60s 内限 5 次
  - `register:{phone}` — 60s 内限 3 次
- `utils/token.js`：JWT 本地存储（access + refresh token），解析不验签（由服务端负责）

### 状态管理
Vuex 分两个命名空间模块：
- `auth`：登录态、token、userInfo。getter `isLoggedIn` 和 `userId`（从 JWT payload 解析）
- `order`：订单列表分页、当前订单、加载状态。getter `pendingPaymentOrders`、`orderCount`

### 订单状态流
定义在 `api/order.js` 的 `ORDER_STATUS` 常量（7 个状态 + 中文标签映射 `ORDER_STATUS_LABEL`）：
`pending_payment → pending_ship → shipped → delivered → completed`，支路：`cancelled`、`refunding`

订单卡片 `OrderCard.vue` 根据不同状态显示不同操作按钮（去支付/取消/确认收货），状态颜色各不同（红/橙/蓝/绿/灰）。

## 关键约定

- 页面直接调用 `api/` 层，部分页面同时使用 Vuex action（`order/list.vue` 直接调 api，`store/modules/order.js` 也封装了相同调用——两者并存，**勿重构合并**）
- 限流 key 格式固定为 `动作:手机号`（如 `sms:13800138000`），修改时需同步 `login.vue`、`register.vue`（两页面各自独立使用限流，非共享组件）
- `pages.json` 中首页必须是 `pages/index/index`（tabBar 入口），登录/注册页不在 tabBar 中
- 路径别名 `@/` 映射到项目根目录（uni-app 默认），源码中 `@/api/auth.js` 等 import 不能直接在 Node.js 里 resolve——`test_node.mjs` 和 `demo.html` 都用了内联实现绕过此限制
- `demo.html` 和 `test_node.mjs` 通过 mock `uni` 全局对象运行，与真实 uni-app 行为等价。修改 `utils/request.js` 的 token 刷新逻辑时，注意 mock 必须同时触发 `opts.success` 回调和 resolve Promise（真实 `uni.request` 两路都支持）
- 本项目使用 Vue 2 + Options API，无 Composition API / `<script setup>`。组件内访问 store 使用 `mapState`/`mapGetters`/`mapActions` 或直接 `this.$store`
- 登录和注册页面各自独立实现了短信发送+倒计时逻辑（非共享 mixin），修改时注意同步两处
- `manifest.json` 为 uni-app 项目清单文件（appId、权限等），不可删除
