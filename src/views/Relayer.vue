<!-- eslint-disable -->
<template>
  <div class="container-md px-0">
    <b-card>
      <b-alert
        variant="danger"
        :show="syncing"
      >
        <div class="alert-body">
          <span>No new block is produced since  <strong>{{ latestTime }}</strong> </span>
        </div>
      </b-alert>
      <b-card
        no-body
        class="mb-1"
      >
        <b-button
          to="./uptime/my"
          variant="primary"
        >
          Browse favourate only
        </b-button>
        <b-form-input
          v-model="query"
          placeholder="Keywords to filter validators"
        />
      </b-card>
      <b-row>
        <b-col
          v-for="(x,index) in uptime"
          :key="index"
          sm="12"
          md="4"
          class="text-truncate"
        >
        <span class="d-inline-block text-truncate font-weight-bold align-bottom">{{ index+1 }}. {{ x.chain_data.chain_name }}</span>

        <RelayerBlock 
          :chain= "x.chain_data"
          :vals = "uptime"/>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
/* eslint-disable */
import RelayerBlock from './RelayerBlock.vue'

import {
  BRow, BCol, VBTooltip, BFormInput, BCard, BAlert, BFormCheckbox, BButton,
} from 'bootstrap-vue'
import { timeIn, toDay } from '@/libs/data'
export default {
  components: {
    BRow,
    BCol,
    BFormInput,
    BCard,
    BAlert,
    BButton,
    BFormCheckbox,
    RelayerBlock
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
      chain_info: [],
      syncing: false,
      latestTime: '',
    }
  },
  computed: {
    uptime() {
      const vals = this.chain_info

      //TODO : ADD NOTIONAL ADDR HERE
      const ans = Object.entries(vals).map(x => ({
        chain_data: x[1],
        address: "fucking that shit",
      }))
      return ans
    },
  },
  
  created() {
    this.chain_info = JSON.parse(localStorage.getItem('chains'))
  },
  beforeDestroy() {
    this.blocks = [] // clear running tasks if it is not finish
    this.syncing = false
    clearInterval(this.timer)
  }
}
</script>

<style></style>