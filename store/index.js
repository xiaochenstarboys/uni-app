import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth.js'
import order from './modules/order.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: { auth, order },
})
