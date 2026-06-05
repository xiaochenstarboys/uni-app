import { login, logout, register } from '@/api/auth.js'
import { getToken, clearTokens, parseToken } from '@/utils/token.js'

const state = {
  token: getToken(),
  userInfo: null,
}

const getters = {
  isLoggedIn: (state) => !!state.token,
  userId: (state) => {
    const payload = parseToken(state.token)
    return payload?.userId || null
  },
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER_INFO(state, info) {
    state.userInfo = info
  },
  CLEAR_AUTH(state) {
    state.token = ''
    state.userInfo = null
  },
}

const actions = {
  async login({ commit }, params) {
    const res = await login(params)
    commit('SET_TOKEN', res.token)
    commit('SET_USER_INFO', res.userInfo || null)
    return res
  },

  async logout({ commit }) {
    await logout()
    commit('CLEAR_AUTH')
    clearTokens()
  },
}

export default { namespaced: true, state, getters, mutations, actions }
