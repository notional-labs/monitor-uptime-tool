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
          <b-form-checkbox
            v-model="pinned"
            :value="`${chain}#${x.address}`"
            class="custom-control-warning"
            @change="pinValidator(`${chain}#${x.address}`)"
          ><span class="d-inline-block text-truncate font-weight-bold align-bottom">{{ index+1 }} {{x.address }}</span>
          </b-form-checkbox>
          <div class="d-flex justify-content-between align-self-stretch flex-wrap">
            <div
              v-for="(b,i) in blocks"
              :key="i"
              style="width:1.5%;"
            ><router-link :to="`./blocks/${b.height}`">
              <div
                v-b-tooltip.hover.v-second
                :title="b.height"
                :class="b.sigs && b.sigs[x.address] ? b.sigs[x.address] : 'bg-light-success'"
                class="m-auto"
              >&nbsp;</div>
            </router-link>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
import {
  BRow, BCol, VBTooltip, BFormInput, BCard, BAlert, BFormCheckbox, BButton,
} from 'bootstrap-vue'

import { timeIn, toDay } from '@/libs/data'
/* eslint-disable */

export default {
  components: {
    BRow,
    BCol,
    BFormInput,
    BCard,
    BAlert,
    BButton,
    BFormCheckbox,
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
      missing: {},
      blocks: Array.from('0'.repeat(50)).map(x => ({ sigs: {}, height: Number(x) })),
      syncing: false,
      latestTime: '',
    }
  },
  computed: {
    uptime() {
      const vals = this.chain_info
      return Object.entries(vals).map(x => ({
        validator: x.chain_name,
        address: x.chain_name,
      }))
    },
  },
  created() {
    this.chain_info = JSON.parse(localStorage.getItem('chains'))
    this.initBlocks()
  },
  beforeDestroy() {
    this.blocks = [] // clear running tasks if it is not finish
    this.syncing = false
    clearInterval(this.timer)
  },
  methods: {
    pinValidator() {
      localStorage.setItem('pinned', this.pinned)
    },
    initBlocks() {
      this.$http.getLatestBlock().then(d => {
        const { height } = d.block.last_commit
        if (timeIn(d.block.header.time, 3, 'm')) {
          this.syncing = true
        } else {
          this.syncing = false
        }
        this.latestTime = toDay(d.block.header.time, 'long')
        const blocks = []
        // update height
        let promise = Promise.resolve()
        for (let i = height - 1; i > height - 50; i -= 1) {
          blocks.unshift({ sigs: {}, height: i > 0 ? i : 0 })
          if (i > height - 48 && i > 0) {
            promise = promise.then(() => new Promise(resolve => {
              this.fetch_status(i, resolve)
            }))
          }
        }

        const sigs = this.initColor()
        // d.block.last_commit.signatures.forEach(x => {
        //   if (x.validator_address) sigs[x.validator_address] = 'bg-success'
        // })
        blocks.push({ sigs, height })
        this.blocks = blocks

        this.timer = setInterval(this.fetch_latest, 6000)
      })
    },
    initColor() {
      const sigs = {}
      Object.entries(this.chain_info).forEach(x => {
        sigs[x.chain_name] = 'bg-success'
      })
      return sigs
    },
    fetch_status(height, resolve) {
      const block = this.blocks.find(b => b.height === height)
      if (block) {
        this.$http.getBlockByHeight(height).then(res => {
          resolve()
          const sigs = this.initColor()
          res.block.last_commit.signatures.forEach(x => {
            if (x.validator_address) sigs[x.validator_address] = 'bg-success'
          })
          this.$set(block, 'sigs', sigs)
        })
      }
    },
    fetch_latest() {
      this.$http.getLatestBlock().then(res => {
        const sigs = this.initColor()
        res.block.last_commit.signatures.forEach(x => {
          if (x.validator_address) sigs[x.validator_address] = 'bg-success'
        })
        const block = this.blocks.find(b => b[1] === res.block.last_commit.height)
        if (typeof block === 'undefined') { // mei
          // this.$set(block, 0, typeof sigs !== 'undefined')
          if (this.blocks.length >= 50) this.blocks.shift()
          this.blocks.push({ sigs, height: res.block.last_commit.height })
        }
      })
    },
    fetch_status_txs_ibc(height, resolve) {
      const lschains = JSON.parse(localStorage.getItem('chains'))
      const addresses = JSON.parse(localStorage.getItem('addresses'))

      const block = this.blocks.find(b => b.height === height)
      if (block) {
        for (const config in lschains){
          const height = this.$http.getLatestBlock(config).then(res => {
            return res.block.last_commit.height
          })
          
          this.$http.getTxsByHeight(height, config).then(res => {
            const sigs = this.initColor()

            if (res.total_count == 0){  
              sigs[config.chain_name] = 'bg-white'
              this.blocks[49] = {sigs, height: res.block.last_commit.height}
              return
            }
            const transacsion_ls = res.txs
            const transaction_res = res.tx_responses

            for (let i = 0; i < res.total_count; i++ ){
              if (!transacsion_ls[i].body.messages[0].includes('MsgUpdateClient') 
              && !transacsion_ls[i].body.messages[0].includes('MsgAcknowledgement') 
              && !transacsion_ls[i].body.messages[0].includes('MsgRecvPacket')){
                continue
              }
              //msg Fail 
              if (transaction_res[i].code !== 0){
                sigs[addresses[config.chain_name]] = "bg-danger"
              }
            }

            const block = this.blocks.find(b => b[1] === height)
            if (typeof block === 'undefined' && res.total_count !== 0 ) {
              // this.$set(block, 0, typeof sigs !== 'undefined')
              if (this.blocks.length >= 50) this.blocks.shift()
              this.blocks.push({ sigs, height: height })
            }
        })
      }}
    },
    fetch_latest_txs_ibc() {
      const lschains = JSON.parse(localStorage.getItem('chains'))
      const addresses = JSON.parse(localStorage.getItem('addresses'))

      for (const config in lschains){
        const height = this.$http.getLatestBlock(config).then(res => {
          return res.block.last_commit.height
        })
        
        this.$http.getTxsByHeight(height, config).then(res => {
          const sigs = this.initColor()

          if (res.total_count == 0){  
            sigs[config.chain_name] = 'bg-white'
            this.blocks[49] = {sigs, height: res.block.last_commit.height}
            return
          }
          const transacsion_ls = res.txs
          const transaction_res = res.tx_responses

          for (let i = 0; i < res.total_count; i++ ){
            if (!transacsion_ls[i].body.messages[0].includes('MsgUpdateClient') 
            && !transacsion_ls[i].body.messages[0].includes('MsgAcknowledgement') 
            && !transacsion_ls[i].body.messages[0].includes('MsgRecvPacket')){
              continue
            }
            //msg Fail
            if (transaction_res[i].code !== 0){
              sigs[addresses[config.chain_name]] = "bg-success"
            }
          }
          const block = this.blocks.find(b => b[1] === height)
          if (typeof block === 'undefined' && res.total_count !== 0 ) {
            // this.$set(block, 0, typeof sigs !== 'undefined')
            if (this.blocks.length >= 50) this.blocks.shift()
            this.blocks.push({ sigs, height: height })
          }
        })
      }
    },
  },
}
</script>

<style></style>