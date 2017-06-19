"use strict";

const h = require('react-hyperscript')
    , { generateRoute } = require('../router')
    , { getCurrentBackend } = require('../backends/utils')

module.exports = [
  {
    name: 'home',
    path: '/',
    Component: h('div'),
    onBeforeRoute(dispatch, params, queryParams, redirect) {
      const currentBackend = getCurrentBackend()

      redirect(!currentBackend
        ? generateRoute('backend-select')
        : generateRoute('backend-home', { identifier: currentBackend.asIdentifier() })
      )
    }
  }
]
