import { getToken, getRefreshToken, setToken, clearTokens, isTokenExpired } from './token.js'

const BASE_URL = 'https://api.example.com'

// Refresh token lock to prevent concurrent refresh races
let isRefreshing = false
let pendingQueue = []

const processPendingQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token)
  })
  pendingQueue = []
}

const refreshAccessToken = () => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken: getRefreshToken() },
      success: (res) => {
        if (res.statusCode === 200 && res.data.token) {
          setToken(res.data.token)
          resolve(res.data.token)
        } else {
          reject(new Error('refresh failed'))
        }
      },
      fail: reject,
    })
  })
}

/**
 * Unified request with auto token injection and silent token refresh.
 * @param {object}  options          - 请求配置
 * @param {string}  options.url      - 接口路径（相对路径，自动拼接 BASE_URL）
 * @param {string}  options.method   - HTTP 方法，默认 GET
 * @param {object}  options.data     - 请求体数据
 * @param {number}  options.timeout  - 超时时间（ms），默认 15000
 * @param {object}  options.header   - 自定义请求头
 * @returns {Promise<object>} 响应数据
 */
export const request = async (options) => {
  const token = getToken()

  // —— 静默刷新 ——
  if (token && isTokenExpired(token)) {
    if (isRefreshing) {
      // 刷新正在进行中，排队等待
      const newToken = await new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
      options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
    } else {
      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        processPendingQueue(null, newToken)
        options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
      } catch (err) {
        processPendingQueue(err)
        clearTokens()
        uni.reLaunch({ url: '/pages/auth/login' })
        throw err
      } finally {
        isRefreshing = false
      }
    }
  } else if (token) {
    options.header = { ...options.header, Authorization: `Bearer ${token}` }
  }

  // —— 发起请求 ——
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout || 15000,
      header: { 'Content-Type': 'application/json', ...options.header },
      success: (res) => {
        if (res.statusCode === 401) {
          clearTokens()
          uni.reLaunch({ url: '/pages/auth/login' })
          return reject(new Error('unauthorized'))
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject,
    })
  })
}
