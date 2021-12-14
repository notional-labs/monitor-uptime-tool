let chains = {}
const configs = require.context('../../chains/mainnet', false, /\.json$/)

const update = {}
configs.keys().forEach(k => {
  const c = configs(k)
  update[c.chain_name] = c
})

chains = update
localStorage.setItem('chains', JSON.stringify(update))
const selected = chains.cosmos

export default {
  namespaced: true,
  state: {
    config: chains,
    selected,
    avatars: {},
    height: 0,
    ibcChannels: {},
    quotes: {},
    defaultWallet: localStorage.getItem('default-wallet'),
  },
  getters: {
    getchains: state => state.chains,
    getAvatarById: state => id => state.avatars[id],
  },
  mutations: {
    setup_sdk_version(state, info) {
      state.chains.config[info.chain_name].sdk_version = info.version
    },
    select(state, args) {
      state.chains.selected = state.chains.config[args.chain_name]
    },
    cacheAvatar(state, args) {
      state.chains.avatars[args.identity] = args.url
    },
    setHeight(state, height) {
      state.chains.height = height
    },
    setChannels(state, { chain, channels }) {
      state.chains.ibcChannels[chain] = channels
    },
    setQuotes(state, quotes) {
      state.quotes = quotes
    },
    setDefaultWallet(state, defaultWallet) {
      if (defaultWallet && defaultWallet.length > 0) {
        localStorage.setItem('default-wallet', defaultWallet)
        state.chains.defaultWallet = defaultWallet
      }
    },
  },
  actions: {
    async getQuotes(context) {
      fetch('https://price.ping.pub/quotes').then(data => data.json()).then(data => {
        context.commit('setQuotes', data)
      })
    },
  },
}
