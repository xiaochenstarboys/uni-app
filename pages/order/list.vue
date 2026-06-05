<template>
  <view class="container">
    <!-- Tab bar -->
    <scroll-view class="tabs" scroll-x>
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @tap="switchTab(tab.value)"
      >{{ tab.label }}</view>
    </scroll-view>

    <!-- Order list -->
    <scroll-view
      class="list"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="orders.length === 0 && !loading" class="empty">
        <text>暂无订单</text>
      </view>

      <order-card
        v-for="order in orders"
        :key="order.orderId"
        :order="order"
        @cancel="handleCancel"
        @confirm="handleConfirm"
        @detail="goDetail"
      />

      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="noMore && orders.length > 0" class="loading-tip">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script>
import { getOrderList, cancelOrder, confirmReceive, ORDER_STATUS_LABEL } from '@/api/order.js'
import OrderCard from '@/components/OrderCard.vue'

export default {
  components: { OrderCard },

  data() {
    return {
      tabs: [
        { label: '全部',   value: '' },
        { label: '待付款', value: 'pending_payment' },
        { label: '待发货', value: 'pending_ship' },
        { label: '已发货', value: 'shipped' },
        { label: '已完成', value: 'completed' },
      ],
      activeTab: '',
      orders: [],
      page: 1,
      loading: false,
      noMore: false,
      refreshing: false,
    }
  },

  onShow() {
    this.reload()
  },

  methods: {
    switchTab(value) {
      this.activeTab = value
      this.reload()
    },

    reload() {
      this.page = 1
      this.noMore = false
      this.orders = []
      this.fetchOrders()
    },

    async onRefresh() {
      this.refreshing = true
      await this.reload()
      this.refreshing = false
    },

    async fetchOrders() {
      if (this.loading || this.noMore) return
      this.loading = true
      try {
        const res = await getOrderList({ status: this.activeTab, page: this.page, pageSize: 10 })
        const list = res.data || []
        this.orders = this.page === 1 ? list : [...this.orders, ...list]
        if (list.length < 10) this.noMore = true
        else this.page++
      } catch (e) {
        uni.showToast({ title: e.message || '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    loadMore() {
      this.fetchOrders()
    },

    async handleCancel(order) {
      const { confirm } = await uni.showModal({ title: '确认取消', content: '确定要取消该订单吗？' })
      if (!confirm) return
      try {
        await cancelOrder(order.orderId, '用户主动取消')
        uni.showToast({ title: '已取消', icon: 'success' })
        this.reload()
      } catch (e) {
        uni.showToast({ title: e.message || '取消失败', icon: 'none' })
      }
    },

    async handleConfirm(order) {
      const { confirm } = await uni.showModal({ title: '确认收货', content: '确认已收到商品？' })
      if (!confirm) return
      try {
        await confirmReceive(order.orderId)
        uni.showToast({ title: '已确认收货', icon: 'success' })
        this.reload()
      } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },

    goDetail(order) {
      uni.navigateTo({ url: `/pages/order/detail?orderId=${order.orderId}` })
    },
  },
}
</script>

<style scoped>
.container { display: flex; flex-direction: column; height: 100vh; }
.tabs { display: flex; white-space: nowrap; background: #fff; border-bottom: 1rpx solid #eee; flex-shrink: 0; }
.tab-item { display: inline-block; padding: 24rpx 32rpx; font-size: 28rpx; color: #666; }
.tab-item.active { color: #07c160; border-bottom: 4rpx solid #07c160; }
.list { flex: 1; background: #f5f5f5; padding: 16rpx; }
.empty { text-align: center; color: #999; padding: 120rpx 0; font-size: 28rpx; }
.loading-tip { text-align: center; color: #999; font-size: 24rpx; padding: 24rpx 0; }
</style>
