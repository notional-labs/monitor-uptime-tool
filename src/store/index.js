import Vue from 'vue'
import Vuex from 'vuex'

// Modules
import app from './app'
import appConfig from './app-config'
import verticalMenu from './vertical-menu'

import chains from './chains'
import address from './address'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    app,
    appConfig,
    verticalMenu,
    chains,
    address,
  },
  mutations: chains.mutations,
  strict: process.env.DEV,
})
