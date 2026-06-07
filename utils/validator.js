/**
 * 通用输入校验工具
 */

/** 手机号格式校验（中国大陆手机号） */
export const validatePhone = (phone) => {
  if (typeof phone !== 'string') return false
  return /^1[3-9]\d{9}$/.test(phone.trim())
}

/** 密码强度校验：至少 8 位，包含字母和数字 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') return false
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)
}

/** 验证码格式校验（6 位数字） */
export const validateSmsCode = (code) => {
  if (typeof code !== 'string') return false
  return /^\d{6}$/.test(code)
}

/** 订单 ID 格式校验（非空字符串） */
export const validateOrderId = (orderId) => {
  return typeof orderId === 'string' && orderId.trim().length > 0
}
