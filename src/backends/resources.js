"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , actions = require('./actions')
    , { BackendStorage } = require('./types')
    , { Route } = require('lib/router')
    , { Link, DropdownMenuItem, DropdownMenuSeparator } = require('lib/ui')
    , { getResponse } = require('../typed-actions/utils')

async function fetchIndividualBackend(dispatch, params={}) {
  if (!params.backendID) {
    throw new Error('Missing `backendID` parameter.')
  }

  const storage = BackendStorage.fromIdentifier(params.backendID)

  const result = await dispatch(actions.fetchBackend(storage))

  return getResponse(result)
}

function backendActions(props) {
  const { backend } = props

  const editableBackendOptions = [
    h(DropdownMenuItem, {
      value: Route('backend-new-authority', {
        backendID: backend.asIdentifier()
      }),
    }, 'Add authority'),

    h(DropdownMenuItem, {
      value: Route('backend-edit', {
        backendID: backend.asIdentifier()
      }),
    }, 'Edit backend'),

    h(DropdownMenuItem, {
      value: Route('backend-sync', {
        backendID: backend.asIdentifier()
      }),
    }, 'Sync'),


    h(DropdownMenuSeparator),
  ]

  return [
    ...(backend.isEditable() ? editableBackendOptions : []),

    h(DropdownMenuItem, {
      value: Route('backend-download', {
        backendID: backend.asIdentifier()
      }),
    }, 'Download JSON'),

    h(DropdownMenuItem, {
      value: Route('backend-history', {
        backendID: backend.asIdentifier()
      }),
    }, 'History'),
  ]
}

function backendBreadcrumb(props, extra) {
  const { backend } = props

  return [
    h(Link, {
      href: Route('open-backend'),
    }, 'Backends'),

    h(Link, {
      href: Route('backend', {
        backendID: backend.asIdentifier()
      })
    }, backend.metadata.label),
    extra
  ]
}

const individualBackendPage = (title, Component) => ({
  title: props => `Backend: ${props.backend.metadata.label} | ${title(props)}`,
  actions: backendActions,
  breadcrumb: props => backendBreadcrumb(props, title(props)),
  onBeforeRoute: fetchIndividualBackend,
  Component: connect((state, props) => ({
    backend: state.backends.available[props.backendID],
    dataset: state.backends.datasets[props.backendID],
  }))(Component)
})

const backendRootActions = props => [
  h(DropdownMenuItem, { value: Route('open-backend') }, 'Open backend'),
  h(DropdownMenuItem, { value: Route('new-backend') }, 'Add backend'),
]

module.exports = {
  '': {
    Component: () => h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      redirect(Route('open-backend'))
    }
  },

  'open-backend': {
    title: () => 'Select backend',
    actions: backendRootActions,
    breadcrumb: () => [
      'Open backend',
    ],
    onBeforeRoute: async (dispatch) => {
      const resp = await dispatch(actions.listAvailableBackends())

      return resp;
    },
    Component: require('./components/BackendSelect')
  },

  'new-backend': {
    title: () => 'Home',
    actions: backendRootActions,
    breadcrumb: () => [
      'Add backend',
    ],
    Component: require('./components/AddBackend')
  },

  'backend': individualBackendPage(
    () => 'Home',
    require('./components/BackendHome')
  ),

  'backend-new-authority': individualBackendPage(
    () => 'Add authority',
    require('./components/AddAuthority')
  ),

  'backend-authority': individualBackendPage(
    props => `View authority (${props.id})`,
    require('./components/Authority')
  ),

  'backend-history': individualBackendPage(
    () => 'History',
    require('./components/History')
  ),

  'backend-edit': individualBackendPage(
    () => 'Edit',
    require('./components/EditBackend')
  ),

  'backend-download': individualBackendPage(
    () => 'Download',
    require('./components/DownloadBackend')
  ),

  'backend-sync': Object.assign(individualBackendPage(
      () => 'Sync',
      require('./components/SyncBackend')
    ), {
      onBeforeRoute: async (dispatch, params) => {
        const resp = await fetchIndividualBackend(dispatch, params)

        await dispatch(actions.listAvailableBackends())

        return resp
      },
      Component: connect((state, props) => ({
        backend: state.backends.available[props.backendID],
        availableBackends: R.values(state.backends.available),
      }))(require('./components/SyncBackend')),
  }),
}
