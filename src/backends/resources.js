"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , { Route } = require('lib/router')
    , { Link, DropdownMenuItem, DropdownMenuHeader, DropdownMenuSeparator } = require('lib/ui')
    , { Text } = require('axs-ui')
    , actions = require('./actions')
    , { BackendStorage } = require('./types')

const backendRoute = props => name =>
  Route(`backend-${name}`, {
    backendID: props.backend.asIdentifier()
  })


const fetchIndividualBackend = includeAuthority =>
  async (dispatch, params={}) => {
    if (!params.backendID) {
      throw new Error('Missing `backendID` parameter.')
    }

    if (includeAuthority && !params.authorityID) {
      throw new Error('Missing `authorityID` parameter.')
    }

    const storage = BackendStorage.fromIdentifier(params.backendID)

    await dispatch(actions.fetchBackend(storage))
  }

const backendBreadcrumb = (isAuthority, makeTitle) =>
  props => {
    const { backend } = props
        , extra = makeTitle(props)

    return [
      h(Link, { href: Route('open-backend'), }, 'Backends'),
      ...isAuthority
        ? [h(Link, { href: backendRoute(props)('browse') }), extra]
        : [backend.metadata.label + ' -- ' + extra],
    ]
  }

const backendRootActions = () =>
  [
    h(DropdownMenuItem, { value: Route('open-backend') }, 'Open backend'),
    h(DropdownMenuItem, { value: Route('new-backend') }, 'Add backend'),
  ]

const individualBackendPage = (makeTitle, Component) => ({
  makeTitle: props => `Backend: ${props.backend.metadata.label} | ${makeTitle(props)}`,
  actionMenuTitle: 'Backend',
  makeActionMenu(props) {
    const route = backendRoute(props)

    return [
      h(DropdownMenuItem, { value: route('browse') }, 'Browse'),
      h(DropdownMenuItem, { value: route('export') }, 'Export'),
      h(DropdownMenuItem, { value: route('history') }, 'History'),
      ...(!props.backend.isEditable() ? [] : [
        h(DropdownMenuSeparator),

        h(DropdownMenuItem, { value: route('new-authority') }, 'Add authority'),
        h(DropdownMenuItem, { value: route('edit') }, 'Edit backend'),
        h(DropdownMenuItem, { value: route('sync') }, 'Sync'),
      ])
    ]
  },
  makeBreadcrumb: backendBreadcrumb(false, makeTitle),
  onBeforeRoute: fetchIndividualBackend(false),
  mapStateToProps(state, props) {
    return {
      backend: state.backends.available[props.params.backendID],
      dataset: state.backends.datasets[props.params.backendID],
    }
  },
  Component,
})

const individualAuthorityPage = (makeTitle, Component) => ({
  title: props => `Backend: ${props.backend.metadata.label} | ${makeTitle(props)}`,
  actionMenuTitle: 'Authority',
  makeActionMenu() {
  },
  breadcrumb: backendBreadcrumb(true, makeTitle),
  onBeforeRoute: fetchIndividualBackend(true),
  Component,
  mapStateToProps(state, props) {
    const dataset = state.backends.datasets[props.params.backendID]

    return {
      backend: state.backends.available[props.params.backendID],
      authority: dataset.periodCollections[props.params.id],
    }
  },
})

module.exports = {
  '': {
    Component: () => h('div'),
    onBeforeRoute(dispatch, params, redirect) {
      redirect(Route('open-backend'))
    }
  },

  'open-backend': {
    makeTitle: () => 'Select backend',
    makeActionMenu: backendRootActions,
    actionMenuTitle: 'Backend list',
    makeBreadcrumb: () => ['Open backend'],
    onBeforeRoute: async (dispatch) => {
      await dispatch(actions.listAvailableBackends())
    },
    mapStateToProps: state => ({
      backends: R.pipe(
        R.values,
        R.sortBy(R.path(['metadata', 'accessed'])),
        R.reverse
      )(state.backends.available)
    }),
    Component: require('./components/BackendSelect')
  },

  'new-backend': {
    title: () => 'Home',
    makeActionMenu: backendRootActions,
    actionMenuTitle: 'Backend list',
    makeBreadcrumb: () => ['Add backend'],
    mapStateToProps: () => ({}),
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

  'backend-authority': individualAuthorityPage(
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
