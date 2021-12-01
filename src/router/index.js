import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  scrollBehavior() {
    return { x: 0, y: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: {
        layout: 'full',
        pageTitle: 'Home',
        breadcrumb: [
          {
            text: 'Home',
            active: true,
          },
        ],
      },
    },
    // chain modules
    {
      path: '/:chain/',
      name: 'info',
      alias: '/:chain',
      component: () => import('@/views/Summary.vue'),
      meta: {
        pageTitle: 'Home',
        breadcrumb: [
          {
            text: 'Home',
            active: true,
          },
        ],
      },
    },
    {
      path: '/:chain/uptime',
      name: 'uptime',
      component: () => import('@/views/Uptime.vue'),
      meta: {
        pageTitle: 'Uptime',
        breadcrumb: [
          {
            text: 'Uptime',
            active: true,
          },
        ],
      },
    },
    {
      path: '/:chain/blocks',
      name: 'blocks',
      component: () => import('@/views/Blocks.vue'),
      meta: {
        pageTitle: 'Blocks',
        breadcrumb: [
          {
            text: 'Blocks',
            active: true,
          },
        ],
      },
    },

    // relayer modules
    {
      path: '/relayer',
      name: 'relayer',
      component: () => import('@/views/Relayer.vue'),
      meta: {
        pageTitle: 'Relayer',
        breadcrumb: [
          {
            text: 'Relayer',
            active: true,
          },
        ],
      },
    },

    // common modules
    {
      path: '/error/error-404',
      name: 'error-404',
      component: () => import('@/views/error/Error404.vue'),
      meta: {
        layout: 'full',
      },
    },
    {
      path: '/error/chain-not-exists',
      name: 'chain-404',
      component: () => import('@/views/error/ChainNotExist.vue'),
      meta: {
        layout: 'full',
      },
    },
    {
      path: '/index.php',
      redirect: '/',
    },
    {
      path: '*',
      redirect: '/error/error-404',
    },
  ],
})

router.beforeEach((to, from, next) => {
  const c = to.params.chain
  if (c) store.commit('select', { chain_name: c })

  const config = JSON.parse(localStorage.getItem('chains'))
  // const has = Object.keys(config).findIndex(i => i === c)
  if (!config || Object.keys(config).findIndex(i => i === c) > -1) {
    next()
  } else if (c) {
    if (c === 'index.php') {
      next({ name: '/' })
    } else {
      next({ name: 'chain-404' })
    }
  } else {
    next()
  }
})

// ? For splash screen
// Remove afterEach hook if you are not using splash screen
router.afterEach(() => {
  // Remove initial loading
  const appLoading = document.getElementById('loading-bg')
  if (appLoading) {
    appLoading.style.display = 'none'
  }
})

export default router
