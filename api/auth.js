import { request } from '../utils/request.js'
import { encrypt } from '../utils/crypto.js'
import { setToken, setRefreshToken, clearTokens } from '../utils/token.js'

export const sendSmsCode = (phone) => {
  return request({ url: '/auth/sms/send', method: 'POST', data: { phone } })
}

export const register = (params) => {
  return request({
    url: '/auth/register',
    method: 'POST',
    data: {
      phone: params.phone,
      password: encrypt(params.password),
      code: params.code,
    },
  })
}

export const login = async (params) => {
  const res = await request({
    url: '/auth/login',
    method: 'POST',
    data: {
      phone: params.phone,
      password: encrypt(params.password),
      code: params.code,
    },
  })
  setToken(res.token)
  setRefreshToken(res.refreshToken)
  return res
}

export const logout = async () => {
  try {
    await request({ url: '/auth/logout', method: 'POST' })
  } finally {
    clearTokens()
  }
}
