<!-- eslint-disable -->
<template>
  <div class="container-md px-0">
    <b-card>
      <b-card
        no-body
        class="mb-1"
      >
      </b-card>
      <b-row>
        <b-col
          v-for="(x,index) in uptime"
          :key="index"
          sm="12"
          md="4"
          class="text-truncate"
        >
          <span class="d-inline-block text-truncate font-weight-bold align-bottom">{{ index+1 }} {{ x.config.chain_name }}</span>

          <UptimeBlock
            :chain="x"
            :vals="uptime"
          />

        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
/* eslint-disable */
import {
  BRow, BCol, VBTooltip, BCard,
} from 'bootstrap-vue'

import UptimeBlock from './UptimeBlock.vue'

import {
  consensusPubkeyToHexAddress, timeIn, toDay, getCachedValidators,
} from '@/libs/data'

export default {
  components: {
    BRow,
    BCol,
    BCard,
    BAlert,
    UptimeBlock
  },
  directives: {
    'b-tooltip': VBTooltip,
  },
  data() {
    const { chain } = this.$route.params
    const pinned = localStorage.getItem('pinned') ? localStorage.getItem('pinned').split(',') : ''
    return {
      pinned,
      chain,
      query: '',
      chains: [],
      syncing: false,
      latestTime: '',
    }
  },
  computed: {
    uptime() {
      const vals = this.chains
      console.log(vals)
      vals.sort((a, b) => b.validator.delegator_shares - a.validator.delegator_shares)
      return vals.map(x => ({
        validator: x.validator,
        address: consensusPubkeyToHexAddress(x.validator.consensus_pubkey),
        config: x.config,
      }))
    },
  },

  created() {
    const cached = JSON.parse(getCachedValidators(this.$route.params.chain))
    if (cached) {
      this.chains = cached
    } else {
      this.$http.getBatchValidator().then(res => {
        this.chains = res
      })
    }
  },

  beforeDestroy() {
    this.blocks = [] // clear running tasks if it is not finish
    this.syncing = false
    clearInterval(this.timer)
  },
}
</script>

<style></style>
