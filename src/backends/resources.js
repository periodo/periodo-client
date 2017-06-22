"use strict";

const h = require('react-hyperscript')
    , actions = require('./actions')
    , { Backend } = require('./types')
    , { generateRoute } = require('../router')

function fetchIndividualBackend(dispatch, params={}) {
  if (!params.backendID) {
    throw new Error('Missing `backendID` parameter.')
  }

  const backend = Backend.fromIdentifier(params.backendID)

  return dispatch(actions.fetchBackend(backend))
}

module.exports = {
  '': {
    Component: () => h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      let currentBackend

      if (global.localStorage) {
        try {
          currentBackend = Backend.deserialize(currentBackend)
        } catch (err) {
          // Just ignore
        }
      }

      redirect(!currentBackend
        ? generateRoute('available-backends')
        : generateRoute('backend', { backendID: currentBackend.asIdentifier() })
      )
    }
  },

  'available-backends': {
    onBeforeRoute(dispatch) {
      return dispatch(actions.listAvailableBackends())
    },
    Component: require('./components/BackendSelect')
  },

  'backend': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./components/BackendHome')
  },

  'backend-new-authority': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./components/AddAuthority')
  },

  'backend-authority': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./components/Authority')
  },

  'backend-history': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./components/History'),
  },
}
