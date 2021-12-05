<template>
    <div class="d-flex justify-content-between align-self-stretch flex-wrap">
            <div
              v-for="(b,i) in blocks"
              :key="i"
              style="width:1.5%;"
            ><router-link :to="`./blocks/${b.height}`">
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
    vals: {
      type: Array,
      default: () => [],
    }
  },
  data() {
    return {
      missing: {},
      blocks: Array.from('0'.repeat(50)).map(x => ({ sigs: "", height: Number(x) })),
      syncing: false,
      latestTime: '',
    }
  },
  created() {
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
        this.timer = setInterval(this.fetch_latest_txs_ibc, 200)
      })
    },
    initColor() {
      return "bg-success"
    },
    //some chain can't query pls check API
    //and change api to get tx_res
    fetch_latest_txs_ibc() {
        this.$http.getLatestBlock(this.chain).then(res1 => {
            var height = res1.block.last_commit.height
            this.$http.getTxsByHeight(height, this.chain).then(res => {
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

            for (let i = 0; i < res.total_count; i++ ){
              //TODO : CHECK NOTIONAL TX HERE
              if (!transacsion_ls[i].body.messages[0].includes('MsgUpdateClient') 
              && !transacsion_ls[i].body.messages[0].includes('MsgAcknowledgement') 
              && !transacsion_ls[i].body.messages[0].includes('MsgRecvPacket')){
                continue
              }
              //msg Fail
              if (transaction_res[i].code !== 0){
                    signal : "bg-danger"
                }
            }
            const block = this.blocks.find(b => b.height === height)
            if (typeof block === 'undefined') { // mei
            // this.$set(block, 0, typeof sigs !== 'undefined')
                if (this.blocks.length >= 50) this.blocks.shift()
                this.blocks.push({ sigs: signal, height : height  })
            }
          })
       })      
    },
  },
}
</script>

