/* eslint-disable */
import Vue from 'vue'
import { ToastPlugin, ModalPlugin } from 'bootstrap-vue'
import VueCompositionAPI from '@vue/composition-api'

// import messages from '@/lang'

import ChainAPI from '@/libs/fetch'
import router from './router'
import store from './store'
import App from './App.vue'

// Global Components
import './global-components'

// 3rd party plugins
import '@/libs/portal-vue'
import '@/libs/toastification'
import '@/libs/clipboard'

// Vue.use(VueGtag, { config: { id: 'UA-238887-1' } }, router)

// BSV Plugin Registration
Vue.use(ToastPlugin)
Vue.use(ModalPlugin)

// Composition API
Vue.use(VueCompositionAPI)

// import core styles
require('@core/scss/core.scss')

// import assets styles
require('@/assets/scss/style.scss')

Vue.config.productionTip = false
Vue.prototype.$http = new ChainAPI()

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
