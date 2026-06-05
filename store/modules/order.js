import { getOrderList, createOrder, ORDER_STATUS } from '@/api/order.js'

const state = {
  orders: [],
  currentOrder: null,
  page: 1,
  noMore: false,
  loading: false,
}

const getters = {
  pendingPaymentOrders: (state) =>
    state.orders.filter(o => o.status === ORDER_STATUS.PENDING_PAYMENT),
  orderCount: (state) => state.orders.length,
}

const mutations = {
  SET_ORDERS(state, orders) {
    state.orders = orders
  },
  APPEND_ORDERS(state, orders) {
    state.orders = [...state.orders, ...orders]
  },
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order
  },
  SET_PAGE(state, page) {
    state.page = page
  },
  SET_NO_MORE(state, val) {
    state.noMore = val
  },
  SET_LOADING(state, val) {
    state.loading = val
  },
  UPDATE_ORDER_STATUS(state, { orderId, status }) {
    const order = state.orders.find(o => o.orderId === orderId)
    if (order) order.status = status
  },
}

const actions = {
  async fetchOrders({ commit, state }, { status = '', reset = false } = {}) {
    if (state.loading || (!reset && state.noMore)) return
    commit('SET_LOADING', true)
    const page = reset ? 1 : state.page
    try {
      const res = await getOrderList({ status, page, pageSize: 10 })
      const list = res.data || []
      if (reset) {
        commit('SET_ORDERS', list)
        commit('SET_PAGE', 1)
        commit('SET_NO_MORE', false)
      } else {
        commit('APPEND_ORDERS', list)
      }
      if (list.length < 10) {
        commit('SET_NO_MORE', true)
      } else {
        commit('SET_PAGE', page + 1)
      }
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createOrder({ commit }, params) {
    const res = await createOrder(params)
    return res.data
  },

  updateOrderStatus({ commit }, payload) {
    commit('UPDATE_ORDER_STATUS', payload)
  },
}

export default { namespaced: true, state, getters, mutations, actions }
