"use strict";

const h = require('react-hyperscript')
    , { getCurrentBackend } = require('../../backends/utils')
    , RouterKnower = require('../../shared/components/router_knower')

const Home = props => {
  const { navigateToRoute } = props
      , currentBackend = getCurrentBackend()

  if (currentBackend) {
    currentBackend.case({
      IndexedDB: () => navigateToRoute('local-backend-home', currentBackend),
      Web: () => navigateToRoute('web-backend-home', currentBackend),
      _: () => null,
    })
  } else {
    navigateToRoute('backend-select')
  }

  return h('div', `Backend homepage for ${currentBackend._name} not yet implemented.`)
}

module.exports = RouterKnower(Home)
