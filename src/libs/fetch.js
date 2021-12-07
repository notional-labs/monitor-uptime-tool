/* eslint-disable */
import fetch from 'node-fetch'
// import axios from 'axios'
import store from '@/store'
import compareVersions from 'compare-versions'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { toBase64 } from '@cosmjs/encoding'
import {
  Validator, StakingParameters, Block, ValidatorDistribution, StakingDelegation, WrapStdTx, getUserCurrency,
} from './data'

function commonProcess(res) {
  if (res && Object.keys(res).includes('result')) {
    return res.result
  }
  return res
}

export default class ChainFetch {
  //============ CHAIN CONFIG ============
  getSelectedConfig() {
    let chain = store.state.chains.selected
    const lschains = localStorage.getItem('chains')
    if (lschains) {
      chain = JSON.parse(lschains)[chain.chain_name]
    }
    if (!chain.sdk_version) {
      chain.sdk_version = '0.33'
    }
    this.config = chain
    return this.config
  }

  //============ END CHAIN CONFIG ============

  isModuleLoaded(name) {
    if (this.config.unload_module) {
      return !this.config.unload_module.includes(name)
    }
    return true
  }

  async getLatestBlock(config = null) {
    const conf = config || this.getSelectedConfig()
    if (conf.chain_name === 'sdsdf') {
      return ChainFetch.fetch('https://tm.injective.network', '/block').then(data => Block.create(commonProcess(data)))
    }
    return this.get('/block', config).then(data => Block.create(commonProcess(data)))
  }

  async getBlockByHeight(height, config = null) {
    const conf = config || this.getSelectedConfig()
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch('https://tm.injective.network', `/block?height=${height}`).then(data => Block.create(commonProcess(data)))
    }
    return this.get(`/block?height=${height}`, config).then(data => Block.create(commonProcess(data)))
  }

  async getBankTotal(denom) {
    if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      return this.get(`/supply/total/${denom}`).then(data => ({ amount: commonProcess(data), denom }))
    }
    return this.get(`/bank/total/${denom}`).then(data => commonProcess(data))
  }

  async getBankTotals() {
    if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      return this.get('/supply/total').then(data => commonProcess(data))
    }
    return this.get('/cosmos/bank/v1beta1/supply').then(data => data.supply)
  }

  async getMintingInflation() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/minting/inflation').then(data => Number(commonProcess(data)))
    }
    return null
  }

  async getStakingParameters() {
    return this.get('/staking/parameters').then(data => {
      this.getSelectedConfig()
      return StakingParameters.create(commonProcess(data), this.config.chain_name)
    })
  }

  //============ Validator List ============

  async getValidatorList() {
    return this.get('/validators').then(data => {
      const vals = commonProcess(data).map(i => new Validator().init(i))
      localStorage.setItem(`validators-${this.config.chain_name}`, JSON.stringify(vals))
      return vals
    })
  }

  async getBatchValidator() {
    // get chain from local storage
    const lschains = JSON.parse(localStorage.getItem('chains'))
    let chains = []
    Promise.all(Object.keys(lschains).map(async (key) => {
      let config = lschains[key]
      let chain = {}
      if (!config.sdk_version) {
        config.sdk_version = '0.33'
      }
      if (config.valAddr) {
        console.log(config.valAddr)
        const val = await this.get(`/staking/validators/${config.valAddr}`, config).then(data => new Validator().init(commonProcess(data)))
        chain['validator'] = val
        chain['config'] = config
        chains.push(chain)
      }
    }));
    return chains
  }

  async getValidatorListByHeight(height) {
    return this.get(`/validatorsets/${height}`).then(data => commonProcess(data))
  }

  async getStakingValidator(address) {
    return this.get(`/staking/validators/${address}`).then(data => new Validator().init(commonProcess(data)))
  }

  //============ End Validator List ============

  async getSlashingParameters() {
    if (this.isModuleLoaded('slashing')) {
      return this.get('/slashing/parameters').then(data => commonProcess(data))
    }
    return null
  }

  async getMintParameters() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/minting/parameters').then(data => commonProcess(data))
    }
    return null
  }

  async getDistributionParameters() {
    return this.get('/distribution/parameters').then(data => commonProcess(data))
  }

  async get(url, config = null) {
    if (!config) {
      this.getSelectedConfig()
    }
    const ret = await fetch((config ? config.endpoint : this.config.endpoint) + url).then(response => response.json())
    console.log(ret)
    return ret
  }

  async getUrl(url) {
    this.getSelectedConfig()
    return fetch(url).then(res => res.json())
  }

  static fetch(host, url) {
    const ret = fetch(host + url).then(response => response.json())
    return ret
  }

  async getBankAccountBalance(address) {
    return this.get('/bank/balances/'.concat(address)).then(data => commonProcess(data))
  }

  async getBankBalances(address, config = null) {
    return this.get('/bank/balances/'.concat(address), config).then(data => commonProcess(data))
  }

  async getIBCDenomTrace(hash, config = null) {
    const h = hash.substring(hash.indexOf('/') + 1)
    return this.get('/ibc/applications/transfer/v1beta1/denom_traces/'.concat(h), config).then(data => commonProcess(data))
  }

  async getIBCChannels(config = null, key = null) {
    if (key) {
      return this.get('/ibc/core/channel/v1beta1/channels?pagination.key='.concat(key), config).then(data => commonProcess(data))
    }
    return this.get('/ibc/core/channel/v1beta1/channels', config).then(data => commonProcess(data))
  }

  // eslint-disable-next-line camelcase
  async getIBCChannelClientState(channel_id, port_id, config = null) {
    // eslint-disable-next-line camelcase
    return this.get(`/ibc/core/channel/v1beta1/channels/${channel_id}/ports/${port_id}/client_state`, config).then(data => commonProcess(data))
  }

  static async getBankBalance(baseurl, address) {
    return ChainFetch.fetch(baseurl, '/bank/balances/'.concat(address)).then(data => commonProcess(data))
  }

  static async getIBCDenomTrace(baseurl, hash) {
    const h = hash.substring(hash.indexOf('/'))
    return ChainFetch.fetch(baseurl, '/ibc/applications/transfer/v1beta1/denom_traces/'.concat(h)).then(data => commonProcess(data))
  }

  static async getIBCDenomTraceText(baseurl, hash) {
    return ChainFetch.getIBCDenomTrace(baseurl, hash).then(res => res.denom_trace.base_denom)
  }

  async getMarketChart(days = 14, coin = null) {
    const conf = this.getSelectedConfig()
    const currency = getUserCurrency()
    if (conf.coingecko && conf.coingecko.length > 0) {
      return ChainFetch.fetch(' https://api.coingecko.com', `/api/v3/coins/${coin || conf.coingecko}/market_chart?vs_currency=${currency}&days=${days}`)
    }
    return null
  }

  // CoinMarketCap
  static async fetchCoinMarketCap(url) {
    const host = 'https://price.ping.pub'
    return fetch(host + url).then(response => response.json())
  }

  static async fetchTokenQuote(symbol) {
    return ChainFetch.fetchCoinMarketCap(`/quote/${symbol}`)
  }

  // Tx Submit
  async broadcastTx(bodyBytes, config = null) {
    const txString = toBase64(TxRaw.encode(bodyBytes).finish())
    const txRaw = {
      tx_bytes: txString,
      mode: 'BROADCAST_MODE_SYNC', // BROADCAST_MODE_SYNC, BROADCAST_MODE_BLOCK, BROADCAST_MODE_ASYNC
    }
    return this.post('/cosmos/tx/v1beta1/txs', txRaw, config).then(res => {
      if (res.code && res.code !== 0) {
        throw new Error(res.message)
      }
      if (res.tx_response && res.tx_response.code !== 0) {
        throw new Error(res.tx_response.raw_log)
      }
      return res
    })
  }

  async post(url = '', data = {}, config = null) {
    if (!config) {
      this.getSelectedConfig()
    }
    // Default options are marked with *
    const response = await fetch((config ? config.api : this.config.api) + url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      // mode: 'cors', // no-cors, *cors, same-origin
      // credentials: 'same-origin', // redirect: 'follow', // manual, *follow, error
      // referrerPolicy: 'origin', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      headers: {
        'Content-Type': 'text/plain',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    // const response = axios.post((config ? config.api : this.config.api) + url, data)
    return response.json() // parses JSON response into native JavaScript objects
  }
}

// export default chainAPI
