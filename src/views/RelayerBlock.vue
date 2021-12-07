<!-- eslint-disable -->
<template>
    <div class="d-flex justify-content-between align-self-stretch flex-wrap">
          <span>No new tx relayer is produced for <strong>{{ no_tx_count }}</strong> blocks </span>
            <div
              v-for="(b,i) in blocks"
              :key="i"
              style="width:1.5%;"
            >
            <router-link :to="`./blocks/${b.height}`">
              <div
                v-b-tooltip.hover.v-second
                :title="b.height"
                :class="b.sigs ? b.sigs : 'bg-light-success'"
                class="m-auto"
              >&nbsp;</div>
            </router-link>
            </div>
          </div>
          
</template>
<script>

/* eslint-disable */
import { VBTooltip } from 'bootstrap-vue'
import {pubkeyToAccountAddress} from '../libs/data/data'
import {
  timeIn, toDay,
} from '@/libs/data'
export default {
  components: {
  },
  directives: {
    'b-tooltip': VBTooltip,
  },
  props: {
    chain: {
      type: Object,
      default: null,
    },
    relayerAddr: {
      type: String,
      default: "",
    }
  },
  data() {
    return {
      missing: {},
      blocks: Array.from('0'.repeat(50)).map(x => ({ sigs: "", height: Number(x) })),
      syncing: false,
      no_tx_count: 0,
    }
  },
  created() {
    this.current_height = 0
    this.getLatestTxSucessful = false
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
    // query block from before 500 blocks
    initBlocks() {
      this.$http.getLatestBlock(this.chain).then(d => {
        const { height } = d.block.last_commit
        if (timeIn(d.block.header.time, 3, 'm')) {
          this.syncing = true
        } else {
          this.syncing = false
        }
        this.latestTime = toDay(d.block.header.time, 'long')
        const blocks = []
        // update height
        for (let i = height - 1; i > height - 500; i -= 1) {
          const txExisted = this.handleTxFromBlock(height)
          blocks.unshift({ sigs: "bg-light-success", height: i > 0 ? i : 0 })
        }
        this.blocks = blocks
        console.log("set up interval")
        this.timer = setInterval(this.fetch_latest_txs_ibc, 1000)
      })
    },
    initColor() {
      return "bg-light-success"
    },
    //some chain can't query pls check API
    //and change api to get tx_res
    fetch_latest_txs_ibc() {
        console.log(this.chain.chain_name)
        this.$http.getLatestBlock(this.chain).then(blockRes => {
          //stop calling the same height multiple time
          const height = blockRes.block.last_commit.height
          const signal = this.handleTxFromBlock(height)
          
          //handling signal
          if(!signal){
            //signal is null
            //indicating that handleTxFromBlock refuse to process this height
          }
          else if(signal !== "bg-light-success") {
            this.no_tx_count = 0
            if (this.blocks.length >= 50) this.blocks.shift()
            this.blocks.push({ sigs: signal, height : height  })
          }
          else{
            this.handleWhiteBlock(height)
          }
        })      
    },
    // return true for tx existed, false for tx not existed
    handleTxFromBlock(height){
      let signal = this.initColor()
      let signals = new Set()

      if(height > this.current_height){
        this.current_height = height
        //reset state of getLatestTxSucessful for new height
        this.getLatestTxSucessful = false
      }

      if(height <= this.current_height && this.getLatestTxSucessful){
        return null
      }

      this.$http.getTxsByHeight(height, this.chain).then(res => {
        if(!res) return
        // if res.code exists means that there is an error
        else if(res.code){
          console.log("Error = " + res.message)
          return
        }
        else {
          this.getLatestTxSucessful = true
        }

        if (res.txs.length === 0){  
          return
        }
        const transaction_ls = res.txs
        const transaction_res = res.tx_responses

        //extract txs from block
        for (let i = 0; i < res.txs.length; i+=1 ){
          //CHECK IF NO SUCH IBC MESSAGE
          // the first transaction of an IBC packet is always MsgUpdateClient
          if (
            !transaction_ls[i].body.messages[0]["@type"].includes('MsgUpdateClient') 
          ){
            signals.add("bg-light-success")
            continue
          }

          //CHECK IF TX IS FROM THIS CHAIN's NOTIONAL RELAYER
          const addr = pubkeyToAccountAddress(transaction_ls[i].auth_info.signer_infos[0].public_key, this.chain.addr_prefix)
          if(addr != this.relayerAddr){
            signals.add("bg-light-success")
            continue
          }

          if (transaction_res[i].code === 0){
            //handling success tx
            signals.add("bg-success")
          }else{
            //handling fail tx
            signals.add("bg-danger")
          }
        }
      })

      // determine color for this block
      if(signals.has("bg-light-success")){
        signal = "bg-light-success"
      }
      else if(signals.size == 3){
        signal = "bg-warning"
      }
      else if(signals.size == 2 && signals.has("bg-success")){
        signal = "bg-success"
      }
      else if(signals.size == 2 && signals.has("bg-danger")){
        signal = "bg-danger"
      }

      return signal
    },
    //white block is block without tx
    handleWhiteBlock(height){
      const block = this.blocks.find(b => b.height === height)
      if (typeof block === 'undefined') { // mei
        if (this.blocks.length >= 50) this.blocks.shift()
        this.blocks.push({ sigs: "bg-light-success", height : height  })
        this.no_tx_count += 1
      }
    }
  },
}
</script>

