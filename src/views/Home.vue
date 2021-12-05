<template>
  <div class="text-center container-lg">
    <b-nav
      align="right"
      style="width:100%"
      class="nav text-right text-nowrap ml-auto"
    >
      <b-nav-item><dark-toggler /></b-nav-item>
    </b-nav>

    <div>
      <b-row class="match-height">
        <b-col
          md="4"
          sm="6"
        >
            <b-button
              class="btn text-left"
              :to="{ name: 'uptime' }"
            >
              <b-row>
                <b-col cols="8">
                  <b-card-title class="mb-1 text-uppercase"> Uptime </b-card-title>
                </b-col>
              </b-row>
            </b-button>
            <div>
            </div>
            <b-button
              class="btn text-left"
              :to="{ name: 'relayer' }"
            >
              <b-row>
                <b-col cols="8">
                  <b-card-title class="mb-1 text-uppercase"> Relayer </b-card-title>
                </b-col>
              </b-row>
            </b-button>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
/* eslint-disable global-require */
import {
  BRow, BCol, BCardTitle, BNav, BNavItem, BButton,
} from 'bootstrap-vue'
import store from '@/store/index'
import { timeIn, toDay } from '@/libs/data'
import DarkToggler from '@/@core/layouts/components/app-navbar/components/DarkToggler.vue'

export default {
  components: {
    BRow,
    BCol,
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
