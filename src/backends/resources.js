"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
    , actions = require('./actions')
    , { Backend } = require('./types')
    , { Route } = require('lib/router')
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

function backendActions(props) {
  const { backend } = props

  const editableBackendOptions = [
    h(DropdownMenuItem, {
      value: Route('backend-new-authority', {
        backendID: backend.type.asIdentifier()
      }),
    }, 'Add authority'),

    h(DropdownMenuItem, {
      value: Route('backend-edit', {
        backendID: backend.type.asIdentifier()
      }),
    }, 'Edit backend'),

    h(DropdownMenuItem, {
      value: Route('backend-sync', {
        backendID: backend.type.asIdentifier()
      }),
    }, 'Sync'),


    h(DropdownMenuSeparator),
  ]

  return [
    ...(backend.isEditable ? editableBackendOptions : []),

    h(DropdownMenuItem, {
      value: Route('backend-download', {
        backendID: backend.type.asIdentifier()
      }),
    }, 'Download JSON'),

    h(DropdownMenuItem, {
      value: Route('backend-history', {
        backendID: backend.type.asIdentifier()
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
        backendID: backend.type.asIdentifier()
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
    backend: state.backends.loaded[props.backendID]
  }))(Component)
})

module.exports = {
  '': {
    Component: () => h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      redirect(Route('open-backend'))
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
        const props = await fetchIndividualBackend(dispatch, params)

        await dispatch(actions.listAvailableBackends())

        return props;
      },
      Component: connect((state, props) => ({
        backend: state.backends.loaded[props.backendID],
        availableBackends: state.backends.available,
      }))(require('./components/SyncBackend')),
  }),
}
