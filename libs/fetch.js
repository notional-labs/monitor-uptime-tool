// HELPER FOR GETTING INFORMATION

function getSelectedConfig() {
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

async function get(url, config = null) {
    if (!config) {
      this.getSelectedConfig()
    }

    const ret = await fetch((config ? config.api : this.config.api) + url).then(response => response.json())
    return ret;
}