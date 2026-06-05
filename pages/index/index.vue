<template>
  <view class="container">
    <!-- Banner -->
    <swiper class="banner" circular autoplay indicator-dots>
      <swiper-item v-for="(item, idx) in banners" :key="idx">
        <image :src="item.image" class="banner-img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- Category nav -->
    <view class="category-nav">
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="category-item"
        @tap="filterByCategory(cat.id)"
      >
        <view class="cat-icon">{{ cat.icon }}</view>
        <text class="cat-name">{{ cat.name }}</text>
      </view>
    </view>

    <!-- Product grid -->
    <view class="section-title">热门商品</view>
    <view class="product-grid">
      <view
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @tap="goDetail(product)"
      >
        <image :src="product.image" class="product-img" mode="aspectFill" />
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <view class="product-footer">
            <text class="product-price">¥{{ product.price }}</text>
            <button class="add-btn" @tap.stop="addToCart(product)">+</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      banners: [
        { image: 'https://picsum.photos/seed/a/750/300' },
        { image: 'https://picsum.photos/seed/b/750/300' },
        { image: 'https://picsum.photos/seed/c/750/300' },
      ],
      categories: [
        { id: 1, name: '数码', icon: '📱' },
        { id: 2, name: '服装', icon: '👕' },
        { id: 3, name: '食品', icon: '🍎' },
        { id: 4, name: '家居', icon: '🏠' },
        { id: 5, name: '运动', icon: '⚽' },
      ],
      products: [
        { id: 1, name: '无线蓝牙耳机', price: '199.00', image: 'https://picsum.photos/seed/p1/300/300' },
        { id: 2, name: '时尚休闲T恤', price: '89.00',  image: 'https://picsum.photos/seed/p2/300/300' },
        { id: 3, name: '有机苹果礼盒', price: '59.00',  image: 'https://picsum.photos/seed/p3/300/300' },
        { id: 4, name: '北欧风台灯',   price: '149.00', image: 'https://picsum.photos/seed/p4/300/300' },
        { id: 5, name: '运动跑步鞋',   price: '329.00', image: 'https://picsum.photos/seed/p5/300/300' },
        { id: 6, name: '智能手表',     price: '899.00', image: 'https://picsum.photos/seed/p6/300/300' },
      ],
    }
  },

  onShow() {
    const token = uni.getStorageSync('uni_token')
    if (!token) {
      uni.reLaunch({ url: '/pages/auth/login' })
    }
  },

  methods: {
    filterByCategory(id) {
      uni.showToast({ title: `分类 ${id}`, icon: 'none' })
    },

    goDetail(product) {
      uni.showToast({ title: product.name, icon: 'none' })
    },

    addToCart(product) {
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    },
  },
}
</script>

<style scoped>
.container { background: #f5f5f5; min-height: 100vh; }
.banner { height: 300rpx; }
.banner-img { width: 100%; height: 100%; }
.category-nav { display: flex; justify-content: space-around; background: #fff; padding: 32rpx 0; margin-bottom: 16rpx; }
.category-item { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.cat-icon { font-size: 48rpx; }
.cat-name { font-size: 24rpx; color: #333; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; padding: 24rpx 24rpx 16rpx; }
.product-grid { display: flex; flex-wrap: wrap; gap: 16rpx; padding: 0 16rpx 32rpx; }
.product-card { width: calc(50% - 8rpx); background: #fff; border-radius: 12rpx; overflow: hidden; }
.product-img { width: 100%; height: 280rpx; }
.product-info { padding: 16rpx; }
.product-name { font-size: 26rpx; color: #333; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.product-price { font-size: 30rpx; color: #e64340; font-weight: bold; }
.add-btn { width: 56rpx; height: 56rpx; line-height: 56rpx; background: #07c160; color: #fff; border-radius: 50%; font-size: 36rpx; padding: 0; margin: 0; text-align: center; }
</style>
