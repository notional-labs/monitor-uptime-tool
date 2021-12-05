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
            :value="`${chain}#${x.chain_name}`"
            class="custom-control-warning"
            @change="pinValidator(`${chain}#${x.chain_name}`)"
          ><span class="d-inline-block text-truncate font-weight-bold align-bottom">{{ index+1 }} {{ x.chain_name }}</span>
            <h5>No tx abcxyz blala </h5>
          </b-form-checkbox>
          <div class="d-flex justify-content-between align-self-stretch flex-wrap">
            <div
              v-for="(b,i) in blocks"
              :key="i"
              style="width:1.5%;"
            ><router-link :to="`./blocks/${b.sigs[x.chain_name]}`">
              <div
                v-b-tooltip.hover.v-second
                :title="b.sigs[x.chain_name]"
                :class="b.sigs && b.sigs[x.chain_name] ? b.sigs[x.chain_name] : 'bg-light-danger'"
                class="m-auto"
              >
              &nbsp;</div>
            </router-link>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
/* eslint-disable */

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
      const addresses = JSON.parse(localStorage.getItem('addresses'))

      const vals = this.chain_info

      const ans = Object.entries(vals).map(x => ({
        chain_name: x[0],
        address: "fucking that shit",
      }))
      return ans
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
      const lschains = JSON.parse(localStorage.getItem('chains'))
      const addresses = JSON.parse(localStorage.getItem('addresses'))
      const blocks = []
        // update height
      for (let i = 50; i > 0; i -= 1) {
        blocks.unshift({ sigs: {signal : "", height : ""}})
      }
      let promise = Promise.resolve()

       const sigs = this.initColor()
      // d.block.last_commit.signatures.forEach(x => {
      //   if (x.validator_address) sigs[x.validator_address] = 'bg-success'
      // })
      blocks.push({ sigs })
      this.blocks = blocks

      this.timer = setInterval(this.fetch_latest_txs_ibc, 6000)
    },
    //TODO : query height here add height
    initColor() {
      const lschains = JSON.parse(localStorage.getItem('chains'))
      const sigs = {}
      Object.entries(lschains).forEach(x => {
        sigs[x[1].chain_name] = {signal :'bg-success', height: 0}
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
        for (const config of lschains){
          this.$http.getLatestBlock(config).then(res => {
            const height =  res.block.last_commit.height
          })
          this.$http.getTxsByHeight(8566070, height).then(res => {
            resolve()
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
                sigs[addresses[config.chain_name]] = {
                signal :"bg-danger",
                height : height
                }
              }
            }
          })
        }
        const block = this.blocks.find(b => b[1] === height)
        if (typeof block === 'undefined' && res.total_count !== 0 ) {
          // this.$set(block, 0, typeof sigs !== 'undefined')
          if (this.blocks.length >= 50) this.blocks.shift()
          this.blocks.push({ sigs })
        }
      }
    },
    fetch_latest_txs_ibc() {
      const lschains = JSON.parse(localStorage.getItem('chains'))
      const addresses = JSON.parse(localStorage.getItem('addresses'))
      for (const config in lschains){
        console.log(config)
        this.$http.getLatestBlock(lschains[config]).then(res1 => {
            var height = res1.block.last_commit.height
            this.$http.getTxsByHeight(height, lschains[config]).then(res => {
            const sigs = this.initColor()
            if (res.txs.length == 0){  
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
                sigs[addresses[config.chain_name]] = {
                  signal : "bg-danger",
                  height : height
                }
              }
            }
          })
       })
        const block = this.blocks.find(b => b[1] === height)
        if (typeof block === 'undefined' && res.total_count !== 0 ) {
          // this.$set(block, 0, typeof sigs !== 'undefined')
          if (this.blocks.length >= 50) this.blocks.shift()
          this.blocks.push({ sigs })
        }
      }
    },
  },
}
</script>

<style></style>