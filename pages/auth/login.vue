<template>
  <view class="container">
    <view class="logo">
      <text class="title">安全登录</text>
    </view>

    <view class="form">
      <view class="input-group">
        <input
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          class="input"
        />
      </view>

      <view class="input-group">
        <input
          v-model="form.password"
          :type="showPwd ? 'text' : 'password'"
          placeholder="请输入密码"
          class="input"
        />
        <text class="eye-btn" @tap="showPwd = !showPwd">{{ showPwd ? '隐' : '显' }}</text>
      </view>

      <view class="input-group code-group">
        <input
          v-model="form.code"
          type="number"
          maxlength="6"
          placeholder="验证码"
          class="input"
        />
        <button
          class="send-btn"
          :disabled="!!countdown"
          @tap="handleSendCode"
        >{{ countdown ? `${countdown}s` : '获取验证码' }}</button>
      </view>

      <button class="submit-btn" :loading="loading" @tap="handleLogin">登录</button>

      <view class="footer-links">
        <text @tap="goRegister">没有账号？立即注册</text>
      </view>
    </view>
  </view>
</template>

<script>
import { login } from '@/api/auth.js'
import { checkRateLimit } from '@/utils/rateLimiter.js'
import { validatePhone } from '@/utils/validator.js'
import authForm from '@/mixins/authForm.js'

export default {
  mixins: [authForm],

  data() {
    return {
      form: { phone: '', password: '', code: '' },
      showPwd: false,
      loading: false,
      countdown: 0,
      timer: null,
    }
  },

  methods: {
    async handleLogin() {
      this.form.phone = this.form.phone.trim()
      if (!validatePhone(this.form.phone)) return uni.showToast({ title: '手机号格式有误', icon: 'none' })
      if (!this.form.password) return uni.showToast({ title: '请输入密码', icon: 'none' })
      if (!this.form.code) return uni.showToast({ title: '请输入验证码', icon: 'none' })

      // 前端限流：登录接口 1 分钟内最多 5 次
      const { allowed, retryAfter } = checkRateLimit(`login:${this.form.phone}`, 5, 60000)
      if (!allowed) {
        return uni.showToast({ title: `登录过于频繁，请 ${retryAfter}s 后重试`, icon: 'none' })
      }

      this.loading = true
      try {
        await login(this.form)
        uni.reLaunch({ url: '/pages/index/index' })
      } catch (e) {
        uni.showToast({ title: e.message || '登录失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    goRegister() {
      uni.navigateTo({ url: '/pages/auth/register' })
    },
  },
}
</script>

<style scoped>
.container { padding: 60rpx 40rpx; }
.title { font-size: 48rpx; font-weight: bold; display: block; text-align: center; margin-bottom: 80rpx; }
.form { display: flex; flex-direction: column; gap: 32rpx; }
.input-group { position: relative; display: flex; align-items: center; border: 1rpx solid #ddd; border-radius: 12rpx; padding: 0 24rpx; height: 96rpx; }
.input { flex: 1; height: 100%; font-size: 28rpx; }
.eye-btn { color: #999; font-size: 24rpx; padding-left: 16rpx; }
.code-group { gap: 16rpx; }
.send-btn { flex-shrink: 0; font-size: 24rpx; padding: 0 20rpx; height: 64rpx; line-height: 64rpx; background: #07c160; color: #fff; border-radius: 8rpx; margin: 0; }
.send-btn[disabled] { background: #ccc; }
.submit-btn { width: 100%; height: 96rpx; background: #07c160; color: #fff; font-size: 32rpx; border-radius: 12rpx; margin-top: 16rpx; }
.footer-links { text-align: center; color: #07c160; font-size: 26rpx; margin-top: 16rpx; }
</style>
