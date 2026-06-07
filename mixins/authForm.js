/**
 * 认证表单共享 mixin — 手机号校验 / SMS 发送 / 倒计时
 *
 * 约定：
 * - 使用此 mixin 的组件需定义 data() { form: { phone, code }, countdown, timer }
 * - 当前倒计时秒数存储在 this.countdown 中（初始为 0）
 */

import { validatePhone } from '@/utils/validator.js'
import { sendSmsCode } from '@/api/auth.js'
import { checkRateLimit } from '@/utils/rateLimiter.js'

export default {
  methods: {
    validatePhone() {
      return validatePhone(this.form.phone)
    },

    /**
     * 发送短信验证码（含前端限流 + 60s 倒计时）
     */
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

    /** 启动倒计时（秒） */
    startCountdown(seconds) {
      this.countdown = seconds
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 1000)
    },
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
}
