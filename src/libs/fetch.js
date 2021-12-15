/* eslint-disable */
import fetch from 'node-fetch'
// import axios from 'axios'
import store from '@/store'
import compareVersions from 'compare-versions'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { toBase64 } from '@cosmjs/encoding'
import {
  Validator, Block, WrapStdTx, getUserCurrency,
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
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch('https://tm.injective.network', '/block').then(data => Block.create(commonProcess(data)))
    }
    return this.get('/blocks/latest', config).then(data => Block.create(data))
  }

  async getBlockByHeight(height, config = null) {
    const conf = config || this.getSelectedConfig()
    if (conf.chain_name === 'injective') {
      return ChainFetch.fetch('https://tm.injective.network', `/block?height=${height}`).then(data => Block.create(commonProcess(data)))
    }
    return this.get(`/blocks/${height}`, config).then(data => Block.create(data))
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
        const val = await this.get(`/staking/validators/${config.valAddr}`, config).then(data => new Validator().init(commonProcess(data)))
        //    localStorage.setItem(`validator-${config.chain_name}`, JSON.stringify(val))
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

  //================ Parameter =================
  async getMintingInflation() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/minting/inflation').then(data => Number(commonProcess(data)))
    }
    return null
  }

  async getMintParameters() {
    if (this.isModuleLoaded('minting')) {
      return this.get('/minting/parameters').then(data => commonProcess(data))
    }
    return null
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
  //============ End Parameter =================

  //================= Tx =======================
  async getTxs(hash) {
    const ver = this.getSelectedConfig() ? this.config.sdk_version : '0.41'
    // /cosmos/tx/v1beta1/txs/{hash}
    if (ver && compareVersions(ver, '0.40') < 1) {
      return this.get(`/txs/${hash}`).then(data => WrapStdTx.create(data, ver))
    }
    return this.get(`/cosmos/tx/v1beta1/txs/${hash}`).then(data => WrapStdTx.create(data, ver))
  }

  async getTxsBySender(sender, page = 1) {
    return this.get(`/txs?message.sender=${sender}&page=${page}&limit=20`)
  }

  async getTxsByRecipient(recipient) {
    return this.get(`/txs?message.recipient=${recipient}`)
  }

  async getTxsByHeight(height, config = null) {
    const conf = config || this.getSelectedConfig()

    return this.get(`/cosmos/tx/v1beta1/txs?events=tx.height=${height}`, conf)
  }
  //================= End Tx ===================

  
  async get(url, config = null) {
    if (!config) {
      this.getSelectedConfig()
    }
    return await fetch((config ? config.api : this.config.api) + url).then(response => response.json())
  }

  async getUrl(url) {
    this.getSelectedConfig()
    return fetch(url).then(res => res.json())
  }

  static fetch(host, url) {
    const ret = fetch(host + url).then(response => response.json())
    return ret
  }

  //================= IBC ===================
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

  async getIBCChannelClientState(channel_id, port_id, config = null) {
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
  //=============== End IBC =================

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
