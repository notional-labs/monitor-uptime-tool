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
    // query block from before 1000 blocks
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
        for (let i = 50; i > 0; i -= 1) {
            blocks.unshift({ sigs: "bg-light-success"})
        }
        this.blocks = blocks
        console.log("set up interval")
        this.timer = setInterval(this.fetch_latest_txs_ibc, 1000)
      })
    },
    initColor() {
      return "bg-success"
    },
    //some chain can't query pls check API
    //and change api to get tx_res
    fetch_latest_txs_ibc() {
        console.log(this.chain.chain_name)
        this.$http.getLatestBlock(this.chain).then(blockRes => {
          //stop calling the same height multiple time
          var height = blockRes.block.last_commit.height
          if(height > this.current_height){
            this.current_height = height
            //reset state of getLatestTxSucessful for new height
            this.getLatestTxSucessful = false
          }

          if(height <= this.current_height && this.getLatestTxSucessful){
            return
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

            var signal = this.initColor()
            if (res.txs.length === 0){  
                const block = this.blocks.find(b => b.height === height)
                // you can change the colour u like
                signal = 'bg-light-success'
                if (typeof block === 'undefined') { // mei
                // this.$set(block, 0, typeof sigs !== 'undefined')
                    if (this.blocks.length >= 50) this.blocks.shift()
                    this.blocks.push({ sigs: signal, height : height  })
                }
              return
            }
            const transacsion_ls = res.txs
            const transaction_res = res.tx_responses

            for (let i = 0; i < res.txs.length; i+=1 ){
              //CHECK IF NO SUCH IBC MESSAGE
              // the first transaction of an IBC packet is always MsgUpdateClient
              if (
                !transacsion_ls[i].body.messages[0]["@type"].includes('MsgUpdateClient') 
              ){
                signal = "bg-light-success"
                continue
              }

              //CHECK IF TX IS FROM THIS CHAIN's NOTIONAL RELAYER
              const addr = pubkeyToAccountAddress(transacsion_ls[i].auth_info.signer_infos[0].public_key, this.chain.addr_prefix)
              if(addr != this.relayerAddr){
                signal = "bg-light-success"
                continue
              }

              console.log(transacsion_ls[i])

              //msg Fail
              if (transaction_res[i].code !== 0){
                signal = "bg-danger"
                break
              }
              signal = "bg-success"
            }
            const block = this.blocks.find(b => b.height === height)
            if (typeof block === 'undefined') { // mei
            // this.$set(block, 0, typeof sigs !== 'undefined')
              if (this.blocks.length >= 50) this.blocks.shift()
                this.blocks.push({ sigs: signal, height : height  })
                if (signal === "bg-light-success"){
                  this.no_tx_count += 1
                }else{
                  this.no_tx_count = 0
                }
            }
            
          })
        })      
    },
  },
}
</script>

