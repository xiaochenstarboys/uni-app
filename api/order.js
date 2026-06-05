import { request } from '../utils/request.js'

// Order status constants
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',   // 待付款
  PENDING_SHIP:    'pending_ship',      // 待发货
  SHIPPED:         'shipped',           // 已发货
  DELIVERED:       'delivered',         // 已收货
  COMPLETED:       'completed',         // 已完成
  CANCELLED:       'cancelled',         // 已取消
  REFUNDING:       'refunding',         // 退款中
}

export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待付款',
  [ORDER_STATUS.PENDING_SHIP]:    '待发货',
  [ORDER_STATUS.SHIPPED]:         '已发货',
  [ORDER_STATUS.DELIVERED]:       '已收货',
  [ORDER_STATUS.COMPLETED]:       '已完成',
  [ORDER_STATUS.CANCELLED]:       '已取消',
  [ORDER_STATUS.REFUNDING]:       '退款中',
}

export const createOrder = (params) => {
  return request({
    url: '/orders',
    method: 'POST',
    data: {
      items: params.items,        // [{ productId, quantity, price }]
      addressId: params.addressId,
      remark: params.remark || '',
    },
  })
}

export const getOrderList = (params = {}) => {
  return request({
    url: '/orders',
    method: 'GET',
    data: {
      status: params.status || '',
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    },
  })
}

export const getOrderDetail = (orderId) => {
  return request({ url: `/orders/${orderId}`, method: 'GET' })
}

export const cancelOrder = (orderId, reason) => {
  return request({
    url: `/orders/${orderId}/cancel`,
    method: 'POST',
    data: { reason },
  })
}

export const confirmReceive = (orderId) => {
  return request({ url: `/orders/${orderId}/confirm`, method: 'POST' })
}

export const getOrderTrack = (orderId) => {
  return request({ url: `/orders/${orderId}/track`, method: 'GET' })
}

export const applyRefund = (orderId, reason) => {
  return request({
    url: `/orders/${orderId}/refund`,
    method: 'POST',
    data: { reason },
  })
}
