const addresses = require('../../chains/addresses.json')

localStorage.setItem('addresses', JSON.stringify(addresses))

export default {
  namespaced: true,
  state: {
    addresses,
  },
  getters: {
    getAddress: state => state.address,
  },
  mutations: {

  },
  actions: {

  },
}
