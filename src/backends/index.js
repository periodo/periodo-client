"use strict";

const actions = require('./actions')
    , { Backend } = require('./types')

const individualBackendPath = rest =>
  '/backends/:identifier' + rest

function fetchIndividualBackend(dispatch, params) {
  const backend = Backend.fromIdentifier(params.identifier)

  return dispatch(actions.fetchBackend(backend))
}

exports.resources = [
  {
    name: 'backend-select',
    path: '/backends/',
    onBeforeRoute(dispatch) {
      return dispatch(actions.listAvailableBackends())
    },
    Component: require('./pages/BackendSelect')
  },

  {
    name: 'backend-default',
    path: individualBackendPath('/'),
    onBeforeRoute(dispatch, params, queryParams, redirect, pathname) {
      return redirect(pathname + 'home')
    }
  },

  {
    name: 'backend-home',
    path: individualBackendPath('/home'),
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/BackendHome')
  },

  {
    name: 'backend-add-authority',
    path: individualBackendPath('/add-authority'),
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/AddAuthority')
  },

  {
    name: 'backend-view-authority',
    path: individualBackendPath('/authority'),
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/Authority')
  },

  {
    name: 'backend-history',
    path: individualBackendPath('/history'),
    onBeforeRoute: fetchIndividualBackend,
    Component: require('./pages/History'),
  },

]


exports.reducer = require('./reducer')
