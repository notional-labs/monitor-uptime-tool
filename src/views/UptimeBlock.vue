<template>
  <div class="d-flex justify-content-between align-self-stretch flex-wrap">
    <div
      v-for="(b,i) in blocks"
      :key="i"
      style="width:1.5%;"
    ><router-link :to="`./:chains/blocks/${b.height}`">
      <div
        v-b-tooltip.hover.v-second
        :title="b.height"
        :class="b.sigs && b.sigs[chain.address] ? b.sigs[chain.address] : 'bg-light-success'"
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
  consensusPubkeyToHexAddress, timeIn, toDay,
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
      blocks: Array.from('0'.repeat(50)).map(x => ({ sigs: {}, height: Number(x) })),
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
    initBlocks() {
      this.$http.getLatestBlock(this.chain.config).then(d => {
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
        d.block.last_commit.signatures.forEach(x => {
          if (x.validator_address) sigs[x.validator_address] = 'bg-success'
        })
        blocks.push({ sigs, height })
        this.blocks = blocks

        this.timer = setInterval(this.fetch_latest, 3000)
      })
    },
    initColor() {
      const sigs = {}
      this.vals.forEach(x => {
        sigs[consensusPubkeyToHexAddress(x.validator.consensus_pubkey)] = 'bg-danger'
      })
      return sigs
    },
    fetch_status(height, resolve) {
      const block = this.blocks.find(b => b.height === height)
      if (block) {
        this.$http.getBlockByHeight(height, this.chain.config).then(res => {
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
      this.$http.getLatestBlock(this.chain.config).then(res => {
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
  },
}
</script>