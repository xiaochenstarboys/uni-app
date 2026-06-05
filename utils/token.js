const TOKEN_KEY = 'uni_token'
const REFRESH_KEY = 'uni_refresh_token'

export const setToken = (token) => {
  uni.setStorageSync(TOKEN_KEY, token)
}

export const getToken = () => {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export const setRefreshToken = (token) => {
  uni.setStorageSync(REFRESH_KEY, token)
}

export const getRefreshToken = () => {
  return uni.getStorageSync(REFRESH_KEY) || ''
}

export const clearTokens = () => {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(REFRESH_KEY)
}

// Parse JWT payload (no signature verification — server handles that)
export const parseToken = (token) => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export const isTokenExpired = (token) => {
  const payload = parseToken(token)
  if (!payload || !payload.exp) return true
  return Date.now() / 1000 > payload.exp
}
