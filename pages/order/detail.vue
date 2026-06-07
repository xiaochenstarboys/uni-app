<template>
  <view class="container">
    <view v-if="order" class="content">
      <!-- Order status banner -->
      <view class="status-banner">
        <text class="status-text">{{ statusLabel }}</text>
        <text class="order-id">订单号：{{ order.orderId }}</text>
      </view>

      <!-- Shipping address -->
      <view class="card">
        <view class="card-title">收货地址</view>
        <view class="address-info">
          <text class="name">{{ order.address.name }} {{ order.address.phone }}</text>
          <text class="addr">{{ order.address.full }}</text>
        </view>
      </view>

      <!-- Items -->
      <view class="card">
        <view class="card-title">商品信息</view>
        <view v-for="item in order.items" :key="item.productId" class="item-row">
          <image :src="item.image" class="item-img" mode="aspectFill" />
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <view class="item-meta">
              <text class="item-price">¥{{ item.price }}</text>
              <text class="item-qty">×{{ item.quantity }}</text>
            </view>
          </view>
        </view>
        <view class="total-row">
          <text>合计：</text>
          <text class="total-price">¥{{ order.totalAmount }}</text>
        </view>
      </view>

      <!-- Order track -->
      <view class="card">
        <view class="card-title">订单轨迹</view>
        <view v-if="tracks.length === 0" class="empty-track">暂无物流信息</view>
        <view v-for="(track, idx) in tracks" :key="idx" class="track-item">
          <view class="track-dot" :class="{ active: idx === 0 }"></view>
          <view class="track-line" v-if="idx < tracks.length - 1"></view>
          <view class="track-content">
            <text class="track-status">{{ track.status }}</text>
            <text class="track-desc">{{ track.description }}</text>
            <text class="track-time">{{ track.time }}</text>
          </view>
        </view>
      </view>

      <!-- Order meta -->
      <view class="card meta-card">
        <view class="meta-row"><text>下单时间</text><text>{{ order.createdAt }}</text></view>
        <view class="meta-row" v-if="order.paymentTime"><text>支付时间</text><text>{{ order.paymentTime }}</text></view>
        <view class="meta-row" v-if="order.remark"><text>备注</text><text>{{ order.remark }}</text></view>
      </view>
    </view>

    <view v-else class="loading-page">加载中...</view>

    <!-- Action buttons -->
    <view v-if="order" class="action-bar">
      <button
        v-if="order.status === 'pending_payment'"
        class="btn btn-primary"
        @tap="handlePay"
      >去支付</button>
      <button
        v-if="order.status === 'pending_payment'"
        class="btn btn-default"
        @tap="handleCancel"
      >取消订单</button>
      <button
        v-if="order.status === 'shipped'"
        class="btn btn-primary"
        @tap="handleConfirm"
      >确认收货</button>
      <button
        v-if="order.status === 'completed'"
        class="btn btn-default"
        @tap="handleRefund"
      >申请退款</button>
    </view>
  </view>
</template>

<script>
import { getOrderDetail, getOrderTrack, cancelOrder, confirmReceive, applyRefund, ORDER_STATUS_LABEL } from '@/api/order.js'

export default {
  data() {
    return {
      orderId: '',
      order: null,
      tracks: [],
    }
  },

  computed: {
    statusLabel() {
      return ORDER_STATUS_LABEL[this.order?.status] || this.order?.status
    },
  },

  onLoad(options) {
    const id = options.orderId || ''
    if (!id || !id.trim()) {
      uni.showToast({ title: '订单不存在', icon: 'none' })
      return setTimeout(() => uni.navigateBack(), 1200)
    }
    this.orderId = id
    this.fetchDetail()
  },

  methods: {
    async fetchDetail() {
      try {
        const [detail, track] = await Promise.all([
          getOrderDetail(this.orderId),
          getOrderTrack(this.orderId),
        ])
        this.order = detail.data
        this.tracks = track.data || []
      } catch (e) {
        uni.showToast({ title: e.message || '加载失败', icon: 'none' })
      }
    },

    handlePay() {
      uni.showToast({ title: '支付功能开发中', icon: 'none' })
    },

    async handleCancel() {
      const { confirm } = await uni.showModal({ title: '取消订单', content: '确定取消该订单？' })
      if (!confirm) return
      try {
        await cancelOrder(this.orderId, '用户主动取消')
        uni.showToast({ title: '已取消', icon: 'success' })
        this.fetchDetail()
      } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },

    async handleConfirm() {
      const { confirm } = await uni.showModal({ title: '确认收货', content: '确认已收到商品？' })
      if (!confirm) return
      try {
        await confirmReceive(this.orderId)
        uni.showToast({ title: '确认成功', icon: 'success' })
        this.fetchDetail()
      } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },

    async handleRefund() {
      const { confirm } = await uni.showModal({ title: '申请退款', content: '确定申请退款？' })
      if (!confirm) return
      try {
        await applyRefund(this.orderId, '用户申请退款')
        uni.showToast({ title: '退款申请已提交', icon: 'success' })
        this.fetchDetail()
      } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },
  },
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; padding-bottom: 140rpx; }
.status-banner { background: #07c160; padding: 40rpx 32rpx; }
.status-text { font-size: 40rpx; font-weight: bold; color: #fff; display: block; }
.order-id { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; display: block; }
.card { background: #fff; margin: 16rpx; border-radius: 12rpx; padding: 24rpx 32rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.address-info { display: flex; flex-direction: column; gap: 8rpx; }
.name { font-size: 28rpx; color: #333; font-weight: bold; }
.addr { font-size: 26rpx; color: #666; }
.item-row { display: flex; gap: 24rpx; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.item-row:last-of-type { border-bottom: none; }
.item-img { width: 140rpx; height: 140rpx; border-radius: 8rpx; flex-shrink: 0; }
.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.item-name { font-size: 26rpx; color: #333; }
.item-meta { display: flex; justify-content: space-between; }
.item-price { color: #e64340; font-size: 28rpx; }
.item-qty { color: #999; font-size: 26rpx; }
.total-row { display: flex; justify-content: flex-end; gap: 16rpx; padding-top: 16rpx; font-size: 28rpx; color: #333; }
.total-price { color: #e64340; font-weight: bold; }
.empty-track { color: #999; font-size: 26rpx; text-align: center; padding: 24rpx 0; }
.track-item { display: flex; gap: 24rpx; position: relative; padding-bottom: 32rpx; }
.track-dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #ccc; flex-shrink: 0; margin-top: 6rpx; }
.track-dot.active { background: #07c160; }
.track-line { position: absolute; left: 9rpx; top: 26rpx; width: 2rpx; bottom: 0; background: #eee; }
.track-content { display: flex; flex-direction: column; gap: 6rpx; }
.track-status { font-size: 28rpx; font-weight: bold; color: #333; }
.track-desc { font-size: 26rpx; color: #666; }
.track-time { font-size: 24rpx; color: #999; }
.meta-card .meta-row { display: flex; justify-content: space-between; padding: 12rpx 0; border-bottom: 1rpx solid #f0f0f0; font-size: 26rpx; color: #666; }
.meta-card .meta-row:last-child { border-bottom: none; }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 20rpx 32rpx; display: flex; gap: 24rpx; justify-content: flex-end; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.08); }
.btn { height: 80rpx; line-height: 80rpx; padding: 0 40rpx; border-radius: 40rpx; font-size: 28rpx; margin: 0; }
.btn-primary { background: #07c160; color: #fff; }
.btn-default { background: #fff; color: #333; border: 1rpx solid #ddd; }
</style>
