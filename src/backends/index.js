"use strict";

const actions = require('./actions')
    , { Backend } = require('./types')

function fetchIndividualBackend(dispatch, params={}) {
  if (!params.backendID) {
    throw new Error('Missing `backendID` parameter.')
  }

  const backend = Backend.fromIdentifier(params.backendID)

  return dispatch(actions.fetchBackend(backend))
}

exports.resources = {
  'available-backends': {
    onBeforeRoute(dispatch) {
      return dispatch(actions.listAvailableBackends())
    },
    Component: require('./pages/BackendSelect')
  },

  'backend': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/BackendHome')
  },

  'backend-new-authority': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/AddAuthority')
  },

  'backend-authority': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/Authority')
  },

  'backend-history': {
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/History'),
  },
}

exports.reducer = require('./reducer')
