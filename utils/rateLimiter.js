// Sliding window rate limiter stored in memory
const requestMap = {}

/**
 * Check if a key (e.g. phone number or IP) is within allowed rate.
 * @param {string} key    - unique identifier (phone / userId / 'global')
 * @param {number} limit  - max requests allowed in the window
 * @param {number} windowMs - window size in ms
 * @returns {{ allowed: boolean, retryAfter: number }}
 */
export const checkRateLimit = (key, limit = 5, windowMs = 60000) => {
  const now = Date.now()
  if (!requestMap[key]) requestMap[key] = []

  // Drop timestamps outside the window
  requestMap[key] = requestMap[key].filter(t => now - t < windowMs)

  // 惰性清理：窗口内无记录时删 key，防止内存泄漏
  if (requestMap[key].length === 0) {
    delete requestMap[key]
  }

  // 限流检查（key 已被清理时视为无记录，允许通过）
  if (requestMap[key] && requestMap[key].length >= limit) {
    const oldest = requestMap[key][0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // 记录本次请求
  if (!requestMap[key]) requestMap[key] = []
  requestMap[key].push(now)
  return { allowed: true, retryAfter: 0 }
}

export const resetRateLimit = (key) => {
  delete requestMap[key]
}
