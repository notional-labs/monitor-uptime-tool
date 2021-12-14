<template>
  <div class="navbar-container d-flex content align-items-center">

    <!-- Nav Menu Toggler -->
    <ul class="nav navbar-nav d-lg-none">
      <li class="nav-item">
        <b-link
          class="nav-link"
          @click="toggleVerticalMenuActive"
        >
          <b-avatar
            v-if="selected_chain && selected_chain.logo"
            variant="transparent"
            rounded
            size="21"
            :src="selected_chain.logo"
            class="badge-minimal"
          />
          <feather-icon
            v-else
            icon="MenuIcon"
            size="21"
          />
        </b-link>
      </li>
    </ul>

    <!-- Left Col -->
    <div class="bookmark-wrapper align-items-center flex-grow-1 d-none d-lg-flex">
      <b-media
        v-if="selected_chain"
        no-body
      >
        <b-media-aside class="mr-75">
          <b-link
            class="nav-link"
            @click="toggleVerticalMenuActive"
          >
            <b-avatar
              v-b-tooltip.hover.bottom="tips"
              variant="transparent"
              badge
              rounded
              size="42"
              :src="selected_chain.logo"
              class="badge-minimal"
              :badge-variant="variant"
            /></b-link>
        </b-media-aside>
        <b-media-body class="my-auto">
          <h6 class="mb-0 text-uppercase">
            {{ selected_chain.chain_name }}
          </h6>
          <small v-b-tooltip.hover.bottom="'Data Provider'">{{ selected_chain.api }} ({{ selected_chain.sdk_version || '-' }})</small>
        </b-media-body>
      </b-media>
    </div>

    <!-- <dark-Toggler class="d-none d-lg-block" /> -->
    <!-- Right Col -->
    <b-navbar-nav class="nav align-items-center ml-auto">
      <dark-Toggler class="d-none d-lg-block" />
      <search-bar />
    </b-navbar-nav>
  </div>
</template>

<script>
import {
  BLink, BNavbarNav, BMedia, BMediaAside, BAvatar, BMediaBody, VBTooltip,
} from 'bootstrap-vue'
import Ripple from 'vue-ripple-directive'
import DarkToggler from '@core/layouts/components/app-navbar/components/DarkToggler.vue'
import SearchBar from '@core/layouts/components/app-navbar/components/SearchBar.vue'
// import CartDropdown from '@core/layouts/components/app-navbar/components/CartDropdown.vue'
import store from '@/store'
import { timeIn, toDay } from '@/libs/data'
// import UserDropdown from '@core/layouts/components/app-navbar/components/UserDropdown.vue'

export default {
  components: {
    BLink,
    BNavbarNav,
    BAvatar,
    BMedia,
    BMediaAside,
    BMediaBody,

    // Navbar Components
    DarkToggler,
    SearchBar,
    // CartDropdown,
    // UserDropdown,
  },
  directives: {
    'b-tooltip': VBTooltip,
    Ripple,
  },
  props: {
    toggleVerticalMenuActive: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      variant: 'success',
      tips: 'Synced',
    }
  },
  computed: {
    selected_chain() {
      this.block()
      return store.state.chains.selected
    },
    chainVariant() {
      return this.variant
    },
  },
  methods: {
    block() {
      store.commit('setHeight', 0)
      this.$http.getLatestBlock().then(block => {
        store.commit('setHeight', Number(block.block.header.height))
        if (timeIn(block.block.header.time, 1, 'm')) {
          this.variant = 'danger'
          this.tips = `Halted ${toDay(block.block.header.time, 'from')}, Height: ${store.state.chains.height} `
        } else {
          this.variant = 'success'
          this.tips = 'Synced'
        }
      })
    },
  },
}
</script>
