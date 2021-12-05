<template>
<div class="text-center container-lg">
  <div>
    <b-nav align="right" class="nav text-right text-nowrap ml-auto">
      <b-nav-item>
        <dark-toggler />
      </b-nav-item>
    </b-nav>

    <div class="d-flex justify-content-center align-items-center">
      <h1 class="text-primary display-4 font-weight-bolder d-none d-md-block">
        Notional Labs
      </h1>
    </div>

    <p class="mb-1">
      Uptime Monitoring tool for Notional gangs....
    </p>
  </div>

  <div>

    <b-card-group>
      <b-card
        bg-variant="primary"
        style="max-width: 40rem;"
      >
        <b-button
          class="btn text-left"
          :to="{ name: 'uptime' }"
          variant="danger"
        >
          <b-card-title class="mb-1 text-uppercase"> Uptime </b-card-title>
        </b-button>
      </b-card>

      <b-card
        bg-variant="primary"
        style="max-width: 40rem;"
      >
        <b-button class="btn text-left" :to="{ name: 'relayer' }">
          <b-card-title class="mb-1 text-uppercase"> Relayer </b-card-title>
        </b-button>
      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
/* eslint-disable global-require */
import {
  BCardTitle, BNav, BNavItem, BButton,
} from 'bootstrap-vue'
import store from '@/store/index'
import { timeIn, toDay } from '@/libs/data'
import DarkToggler from '@/@core/layouts/components/app-navbar/components/DarkToggler.vue'

export default {
  components: {
    BCardTitle,
    BNav,
    BNavItem,
    DarkToggler,
    BButton,
  },
  computed: {
    imgUrl() {
      if (store.state.appConfig.layout.skin === 'dark') {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.downImg = require('@/assets/images/pages/under-maintenance-dark.svg')
        return this.downImg
      }
      return this.downImg
    },
  },
  methods: {
    fetch() {
      Object.keys(this.chains).forEach(k => {
        const chain = this.chains[k]
        if (chain.api) {
          fetch(`${chain.api}/blocks/latest`).then(res => res.json()).then(b => {
          // console.log(b.block.header)
            const { header } = b.block
            this.$set(chain, 'height', header.height)
            this.$set(chain, 'time', toDay(header.time))
            this.$set(chain, 'variant', timeIn(header.time, 3, 'm') ? 'danger' : 'success')
          })
        }
      })
    },
    goRelayer() {
      this.$router.push('/relayer')
    },
  },
}
</script>
