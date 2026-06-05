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
 */
export const request = (options) => {
  return new Promise(async (resolve, reject) => {
    const token = getToken()

    // Proactively refresh before expiry
    if (token && isTokenExpired(token)) {
      if (isRefreshing) {
        // Queue until refresh completes
        pendingQueue.push({
          resolve: (newToken) => {
            options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
            resolve(request(options))
          },
          reject,
        })
        return
      }

      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        processPendingQueue(null, newToken)
        options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
      } catch (err) {
        processPendingQueue(err)
        clearTokens()
        uni.reLaunch({ url: '/pages/auth/login' })
        return reject(err)
      } finally {
        isRefreshing = false
      }
    } else if (token) {
      options.header = { ...options.header, Authorization: `Bearer ${token}` }
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
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
