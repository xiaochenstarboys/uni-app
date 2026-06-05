<template>
  <view class="container">
    <view class="form">
      <text class="title">注册账号</text>

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
          placeholder="密码（8位以上，含字母和数字）"
          class="input"
        />
        <text class="eye-btn" @tap="showPwd = !showPwd">{{ showPwd ? '隐' : '显' }}</text>
      </view>

      <view class="input-group">
        <input
          v-model="form.confirmPassword"
          :type="showPwd ? 'text' : 'password'"
          placeholder="确认密码"
          class="input"
        />
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

      <button class="submit-btn" :loading="loading" @tap="handleRegister">注册</button>

      <view class="footer-links">
        <text @tap="goLogin">已有账号？去登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { register, sendSmsCode } from '@/api/auth.js'
import { checkRateLimit } from '@/utils/rateLimiter.js'

export default {
  data() {
    return {
      form: { phone: '', password: '', confirmPassword: '', code: '' },
      showPwd: false,
      loading: false,
      countdown: 0,
      timer: null,
    }
  },

  onUnload() {
    clearInterval(this.timer)
  },

  methods: {
    validatePhone() {
      return /^1[3-9]\d{9}$/.test(this.form.phone)
    },

    validatePassword() {
      // 至少8位，包含字母和数字
      return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(this.form.password)
    },

    async handleSendCode() {
      if (!this.validatePhone()) {
        return uni.showToast({ title: '手机号格式有误', icon: 'none' })
      }

      const { allowed, retryAfter } = checkRateLimit(`sms:${this.form.phone}`, 1, 60000)
      if (!allowed) {
        return uni.showToast({ title: `请 ${retryAfter}s 后再试`, icon: 'none' })
      }

      try {
        await sendSmsCode(this.form.phone)
        this.startCountdown(60)
        uni.showToast({ title: '验证码已发送', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: e.message || '发送失败', icon: 'none' })
      }
    },

    startCountdown(seconds) {
      this.countdown = seconds
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) clearInterval(this.timer)
      }, 1000)
    },

    async handleRegister() {
      if (!this.validatePhone()) return uni.showToast({ title: '手机号格式有误', icon: 'none' })
      if (!this.validatePassword()) return uni.showToast({ title: '密码需8位以上且包含字母和数字', icon: 'none' })
      if (this.form.password !== this.form.confirmPassword) return uni.showToast({ title: '两次密码不一致', icon: 'none' })
      if (!this.form.code) return uni.showToast({ title: '请输入验证码', icon: 'none' })

      const { allowed, retryAfter } = checkRateLimit(`register:${this.form.phone}`, 3, 60000)
      if (!allowed) {
        return uni.showToast({ title: `操作过于频繁，请 ${retryAfter}s 后重试`, icon: 'none' })
      }

      this.loading = true
      try {
        await register(this.form)
        uni.showToast({ title: '注册成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } catch (e) {
        uni.showToast({ title: e.message || '注册失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    goLogin() {
      uni.navigateBack()
    },
  },
}
</script>

<style scoped>
.container { padding: 60rpx 40rpx; }
.title { font-size: 48rpx; font-weight: bold; display: block; text-align: center; margin-bottom: 60rpx; }
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
