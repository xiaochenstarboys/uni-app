<template>
  <view class="container">
    <!-- User info header -->
    <view class="header">
      <view class="avatar-wrap">
        <image class="avatar" src="https://picsum.photos/seed/avatar/200/200" mode="aspectFill" />
      </view>
      <view class="user-meta">
        <text class="username">{{ userPhone || '未登录' }}</text>
        <text class="user-id" v-if="userId">UID: {{ userId }}</text>
      </view>
    </view>

    <!-- Stats row -->
    <view class="stats-row">
      <view class="stat-item" @tap="goOrders('pending_payment')">
        <text class="stat-num">{{ stats.pendingPayment }}</text>
        <text class="stat-label">待付款</text>
      </view>
      <view class="divider" />
      <view class="stat-item" @tap="goOrders('pending_ship')">
        <text class="stat-num">{{ stats.pendingShip }}</text>
        <text class="stat-label">待发货</text>
      </view>
      <view class="divider" />
      <view class="stat-item" @tap="goOrders('shipped')">
        <text class="stat-num">{{ stats.shipped }}</text>
        <text class="stat-label">待收货</text>
      </view>
      <view class="divider" />
      <view class="stat-item" @tap="goOrders('completed')">
        <text class="stat-num">{{ stats.completed }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>

    <!-- Menu list -->
    <view class="menu-group">
      <view class="menu-item" @tap="goOrders('')">
        <text class="menu-icon">📦</text>
        <text class="menu-label">全部订单</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goAddress">
        <text class="menu-icon">📍</text>
        <text class="menu-label">收货地址</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goSecurity">
        <text class="menu-icon">🔒</text>
        <text class="menu-label">账号安全</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goAbout">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-label">关于我们</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- Logout -->
    <view class="logout-wrap">
      <button class="logout-btn" :loading="loggingOut" @tap="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { logout } from '@/api/auth.js'
import { parseToken, getToken } from '@/utils/token.js'

export default {
  data() {
    return {
      loggingOut: false,
      stats: { pendingPayment: 0, pendingShip: 0, shipped: 0, completed: 0 },
    }
  },

  computed: {
    userPhone() {
      const payload = parseToken(getToken())
      return payload?.phone || ''
    },
    userId() {
      const payload = parseToken(getToken())
      return payload?.userId || ''
    },
  },

  methods: {
    goOrders(status) {
      uni.switchTab({ url: '/pages/order/list' })
    },
    goAddress() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },
    goSecurity() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },
    goAbout() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },
    async handleLogout() {
      const { confirm } = await uni.showModal({ title: '退出登录', content: '确定要退出吗？' })
      if (!confirm) return
      this.loggingOut = true
      try {
        await logout()
        uni.reLaunch({ url: '/pages/auth/login' })
      } catch {
        uni.reLaunch({ url: '/pages/auth/login' })
      } finally {
        this.loggingOut = false
      }
    },
  },
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }
.header { background: #07c160; padding: 60rpx 40rpx 40rpx; display: flex; align-items: center; gap: 32rpx; }
.avatar-wrap { width: 120rpx; height: 120rpx; border-radius: 50%; overflow: hidden; border: 4rpx solid rgba(255,255,255,0.6); flex-shrink: 0; }
.avatar { width: 100%; height: 100%; }
.user-meta { display: flex; flex-direction: column; gap: 8rpx; }
.username { font-size: 34rpx; font-weight: bold; color: #fff; }
.user-id { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.stats-row { background: #fff; display: flex; align-items: center; padding: 32rpx 0; margin-bottom: 16rpx; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.stat-num { font-size: 36rpx; font-weight: bold; color: #333; }
.stat-label { font-size: 22rpx; color: #999; }
.divider { width: 1rpx; height: 60rpx; background: #eee; }
.menu-group { background: #fff; border-radius: 12rpx; margin: 0 0 16rpx; overflow: hidden; }
.menu-item { display: flex; align-items: center; padding: 32rpx 40rpx; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 36rpx; margin-right: 24rpx; }
.menu-label { flex: 1; font-size: 28rpx; color: #333; }
.menu-arrow { font-size: 32rpx; color: #ccc; }
.logout-wrap { padding: 32rpx 40rpx; }
.logout-btn { width: 100%; height: 96rpx; background: #fff; color: #e64340; border: 1rpx solid #e64340; border-radius: 12rpx; font-size: 32rpx; }
</style>
