<!-- eslint-disable -->
<template>
  <div class="container-md px-0">
    <b-card>
      <b-card
        no-body
        class="mb-1"
      >
      <p style = "text-align: center">Found Notional validators in {{ this.uptime.length }} chains</p>
      </b-card>
      <b-row>
        <b-col
          v-for="(x,index) in uptime"
          :key="index"
          sm="12"
          md="4"
          class="text-truncate"
        >
          <span class="d-inline-block text-truncate font-weight-bold align-bottom">{{ index + 1 }}. {{ x.config.chain_name }}</span>

          <UptimeBlock
            :chain="x"
            :vals="uptime"
          />

        </b-col>
      </b-row>
    </b-card>
  </div>
</template>
<!-- eslint-disable -->
<script>
import {
  BRow, BCol, VBTooltip, BCard,
} from 'bootstrap-vue'

import {
  consensusPubkeyToHexAddress,
} from '@/libs/data'

import UptimeBlock from './UptimeBlock.vue'

export default {
  components: {
    BRow,
    BCol,
    BCard,
    UptimeBlock,
  },
  directives: {
    'b-tooltip': VBTooltip,
  },
  data() {
    const { chain } = this.$route.params
    return {
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
      let activeAddr = 0
      const lschains = JSON.parse(localStorage.getItem('chains'))
      for (let key in lschains) {
        if (lschains[key].valAddr) {
          activeAddr = activeAddr + 1
          console.log(key)
        }
      }
      console.log(vals)
      console.log(activeAddr)
      console.log(Object.keys(lschains).length)
      console.log(vals.length)
      if (vals.length === activeAddr) {
        return vals.map(x => ({
          validator: x.validator,
          address: consensusPubkeyToHexAddress(x.validator.consensus_pubkey),
          config: x.config,
        }))
      }
    },
  },

  created() {
    this.$http.getBatchValidator().then(res => {
      this.chains = res
    })
  },

  beforeDestroy() {
    this.blocks = [] // clear running tasks if it is not finish
    this.syncing = false
    clearInterval(this.timer)
  },
}
</script>

<style></style>
