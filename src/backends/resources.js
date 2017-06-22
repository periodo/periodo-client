"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
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

function BackendAware(Component) {
  return connect((state, props) => ({
    backend: state.backends.loaded[props.backendID]
  }))(Component)
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
    Component: BackendAware(require('./components/BackendHome')),
  },

  'backend-new-authority': {
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/AddAuthority')),
  },

  'backend-authority': {
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/Authority')),
  },

  'backend-history': {
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/History'),),
  },
}
