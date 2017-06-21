"use strict";

const h = require('react-hyperscript')
    , { generateRoute } = require('../router')
    , { getCurrentBackend } = require('../backends/utils')

module.exports = {
  '': {
    Component: h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      const currentBackend = getCurrentBackend()

      redirect(!currentBackend
        ? generateRoute('available-backends')
        : generateRoute('backend', { backendID: currentBackend.asIdentifier() })
      )
    }
  }
}
