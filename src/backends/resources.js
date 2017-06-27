"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
    , actions = require('./actions')
    , { Backend } = require('./types')
    , { generateRoute } = require('../router')
    , { Link, DropdownMenuItem, DropdownMenuSeparator } = require('lib/ui')
    , { getResponse } = require('../typed-actions/utils')

async function fetchIndividualBackend(dispatch, params={}) {
  if (!params.backendID) {
    throw new Error('Missing `backendID` parameter.')
  }

  const backend = Backend.fromIdentifier(params.backendID)

  const result = await dispatch(actions.fetchBackend(backend))

  return {
    backend: getResponse(result)
  }
}

function BackendAware(Component) {
  return connect((state, props) => ({
    backend: state.backends.loaded[props.backendID]
  }))(Component)
}

function backendActions(props) {
  const { backend } = props

  const editableBackendOptions = [
    h(DropdownMenuItem, {
      value: generateRoute('backend-new-authority', { backendID: backend.type.asIdentifier() }),
    }, 'Add authority'),

    h(DropdownMenuItem, {
      value: generateRoute('backend-edit', { backendID: backend.type.asIdentifier() }),
    }, 'Edit backend'),

    h(DropdownMenuItem, {
      value: generateRoute('backend-delete', { backendID: backend.type.asIdentifier() }),
    }, 'Delete'),

    h(DropdownMenuSeparator),
  ]

  return [
    ...(backend.isEditable ? editableBackendOptions : []),

    h(DropdownMenuItem, {
      value: generateRoute('backend-download', { backendID: backend.type.asIdentifier() }),
    }, 'Download JSON'),

    h(DropdownMenuItem, {
      value: generateRoute('backend-history', { backendID: backend.type.asIdentifier() }),
    }, 'History'),
  ]
}

function backendBreadcrumb(props, extra) {
  const { backend } = props

  return [
    h(Link, { href: '#open-backend' }, 'Backends'),
    h(Link,
      { route: 'backend', params: { backendID: backend.type.asIdentifier() }},
      backend.metadata.label
    ),
    extra
  ]
}

module.exports = {
  '': {
    Component: () => h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      redirect(generateRoute('open-backend'))
    }
  },

  'open-backend': {
    title: () => 'Select backend',
    actions: () => [
      h(DropdownMenuItem, { value: '#new-backend'}, 'Add backend')
    ],
    breadcrumb: () => [
      'Backends',
    ],
    onBeforeRoute: async (dispatch) => {
      const resp = await dispatch(actions.listAvailableBackends())

      return resp;
    },
    Component: require('./components/BackendSelect')
  },

  'backend': {
    title: props => `Backend: ${props.backend.metadata.label} | Home`,
    actions: backendActions,
    breadcrumb: props => backendBreadcrumb(props, 'Home'),
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/BackendHome')),
  },

  'backend-new-authority': {
    title: props => `Backend: ${props.backend.metadata.label} | Add authority`,
    actions: backendActions,
    breadcrumb: props => backendBreadcrumb(props, 'Add authority'),
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/AddAuthority')),
  },

  'backend-authority': {
    title: props => `Backend: ${props.backend.metadata.label} | View authority | ${props.id}`,
    actions: backendActions,
    breadcrumb: props => backendBreadcrumb(props, 'View authority'),
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/Authority')),
  },

  'backend-history': {
    title: props => `Backend: ${props.backend.metadata.label} | History`,
    actions: backendActions,
    breadcrumb: props => backendBreadcrumb(props, 'History'),
    onBeforeRoute: fetchIndividualBackend,
    Component: BackendAware(require('./components/History'),),
  },
}
