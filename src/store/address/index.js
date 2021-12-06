const addresses = require('../../chains/address.json')

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
