<template>
  <view class="card" @tap="$emit('detail', order)">
    <!-- Header -->
    <view class="card-header">
      <text class="order-id">订单号：{{ order.orderId }}</text>
      <text class="status" :class="order.status">{{ statusLabel }}</text>
    </view>

    <!-- Items preview (first item + count) -->
    <view class="item-row">
      <image :src="firstItem.image" class="item-img" mode="aspectFill" />
      <view class="item-info">
        <text class="item-name">{{ firstItem.name }}</text>
        <text class="item-spec" v-if="firstItem.spec">{{ firstItem.spec }}</text>
      </view>
      <view class="item-right">
        <text class="item-price">¥{{ firstItem.price }}</text>
        <text class="item-qty">×{{ firstItem.quantity }}</text>
      </view>
    </view>
    <view v-if="order.items.length > 1" class="more-items">
      共 {{ order.items.length }} 件商品
    </view>

    <!-- Footer -->
    <view class="card-footer">
      <text class="total">合计：<text class="total-price">¥{{ order.totalAmount }}</text></text>
      <view class="actions" @tap.stop>
        <button
          v-if="order.status === 'pending_payment'"
          class="btn btn-default"
          @tap="$emit('cancel', order)"
        >取消</button>
        <button
          v-if="order.status === 'pending_payment'"
          class="btn btn-primary"
          @tap="goPay"
        >去支付</button>
        <button
          v-if="order.status === 'shipped'"
          class="btn btn-primary"
          @tap="$emit('confirm', order)"
        >确认收货</button>
        <button
          v-if="order.status === 'completed'"
          class="btn btn-default"
          @tap="$emit('detail', order)"
        >再次购买</button>
      </view>
    </view>
  </view>
</template>

<script>
import { ORDER_STATUS_LABEL } from '@/api/order.js'

export default {
  name: 'OrderCard',
  props: {
    order: { type: Object, required: true },
  },

  computed: {
    statusLabel() {
      return ORDER_STATUS_LABEL[this.order.status] || this.order.status
    },
    firstItem() {
      return this.order.items[0] || {}
    },
  },

  methods: {
    goPay() {
      uni.showToast({ title: '支付功能开发中', icon: 'none' })
    },
  },
}
</script>

<style scoped>
.card { background: #fff; border-radius: 12rpx; margin-bottom: 16rpx; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 32rpx 16rpx; border-bottom: 1rpx solid #f5f5f5; }
.order-id { font-size: 24rpx; color: #999; }
.status { font-size: 26rpx; font-weight: bold; }
.status.pending_payment { color: #e64340; }
.status.pending_ship { color: #ff9900; }
.status.shipped { color: #576b95; }
.status.delivered, .status.completed { color: #07c160; }
.status.cancelled { color: #999; }
.status.refunding { color: #ff9900; }
.item-row { display: flex; align-items: center; padding: 24rpx 32rpx; gap: 20rpx; }
.item-img { width: 120rpx; height: 120rpx; border-radius: 8rpx; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 26rpx; color: #333; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-spec { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8rpx; flex-shrink: 0; }
.item-price { font-size: 26rpx; color: #333; }
.item-qty { font-size: 22rpx; color: #999; }
.more-items { text-align: right; padding: 0 32rpx 16rpx; font-size: 24rpx; color: #999; }
.card-footer { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 32rpx 24rpx; border-top: 1rpx solid #f5f5f5; }
.total { font-size: 26rpx; color: #666; }
.total-price { color: #e64340; font-weight: bold; font-size: 28rpx; }
.actions { display: flex; gap: 16rpx; }
.btn { height: 64rpx; line-height: 64rpx; padding: 0 32rpx; border-radius: 32rpx; font-size: 24rpx; margin: 0; }
.btn-primary { background: #07c160; color: #fff; }
.btn-default { background: #fff; color: #333; border: 1rpx solid #ddd; }
</style>
