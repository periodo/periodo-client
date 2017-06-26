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
      redirect(generateRoute('open-backend'))
    }
  },

  'open-backend': {
    title: 'Select backend',
    onBeforeRoute: async (dispatch) => {
      const resp = await dispatch(actions.listAvailableBackends())

      return resp;
    },
    Component: require('./components/BackendSelect')
  },

  'backend': {
    title: 'View backend',
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
