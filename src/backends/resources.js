"use strict";

const actions = require('./actions')
    , { Backend } = require('./types')

module.exports = [
  {
    name: 'backend-select',
    path: '/backends/',
    onBeforeRoute(dispatch) {
      return dispatch(actions.listAvailableBackends())
    },
    Component: require('./pages/BackendSelect')
  },

  {
    name: 'local-backend-home',
    path: '/backends/local/:id/',
    onBeforeRoute(dispatch, params) {
      const id = parseInt(params.id)
          , backend = Backend.IndexedDB(id)

      return dispatch(actions.fetchBackend(backend))
    },
    Component: require('./pages/BackendHome')
  },

  {
    name: 'web-backend-home',
    path: '/backends/web/:url/',
    onBeforeRoute(dispatch, params) {
      const url = decodeURIComponent(params.url)
          , backend = Backend.Web(url)

      return dispatch(actions.fetchBackend(backend))
    },
    Component: require('./pages/BackendHome')
  }
]
