import store from '@/store'

const modules = [
  {
    scope: 'normal',
    title: 'summary',
    route: 'info',
  },
  {
    scope: 'normal',
    title: 'blocks',
    route: 'blocks',
  },
]

function processMenu() {
  const chainMenus = [
    {
      header: 'relayer',
    },
    {
      header: 'uptime',
    },
  ]

  Object.keys(store.state.chains.config).forEach(chain => {
    const menu = {
      title: chain,
      icon: store.state.chains.config[chain].logo,
    }
    const { excludes } = store.state.chains.config[chain]
    const children = []
    modules.forEach(m => {
      if (excludes === undefined || excludes.indexOf(m.route) === -1) {
        children.push({
          title: m.title,
          route: { name: m.route, params: { chain } },
        })
      }
    })
    menu.children = children
    chainMenus.push(menu)
  })
  return chainMenus
}

export default processMenu()
