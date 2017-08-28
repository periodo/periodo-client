"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , { Route } = require('periodo-router')
    , { Link, DropdownMenuItem, DropdownMenuSeparator } = require('periodo-ui')
    , actions = require('./actions')
    , { BackendStorage } = require('./types')

const backendRoute = props => name =>
  Route(`backend-${name}`, {
    backendID: props.backend.asIdentifier()
  })

const authorityRoute = props => name =>
  Route(`backend-authority-${name}`, {
    backendID: props.backend.asIdentifier(),
    authorityID: props.authority.id,
  })


const fetchIndividualBackend = (includeAuthority, includePeriod) =>
  async (dispatch, params={}) => {
    if (!params.backendID) {
      throw new Error('Missing `backendID` parameter.')
    }

    if (includeAuthority && !params.authorityID) {
      throw new Error('Missing `authorityID` parameter.')
    }

    if (includePeriod && !params.periodID) {
      throw new Error('Missing `periodID` parameter.')
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
        ? [h(Link, { href: backendRoute(props)('home') }, backend.metadata.label), extra]
        : [backend.metadata.label, extra],
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
      h(DropdownMenuItem, { value: route('home') }, 'Home'),
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
  makeTitle: props => `Backend: ${props.backend.metadata.label} | ${makeTitle(props)}`,
  actionMenuTitle: 'Authority',
  makeActionMenu(props) {
    const route = authorityRoute(props)

    return [
      h(DropdownMenuItem, { value: route('view') }, 'View authority'),
      h(DropdownMenuItem, { value: route('history') }, 'History'),
      h(DropdownMenuItem, { value: route('add-period') }, 'Add period'),
      h(DropdownMenuItem, { value: route('edit') }, 'Edit authority'),
    ]
  },
  makeBreadcrumb: backendBreadcrumb(true, makeTitle),
  onBeforeRoute: fetchIndividualBackend(true),
  Component,
  mapStateToProps(state, props) {
    const dataset = state.backends.datasets[props.params.backendID]

    return {
      backend: state.backends.available[props.params.backendID],
      dataset: state.backends.datasets[props.params.backendID],
      authority: dataset.periodCollections[props.params.authorityID],
    }
  },
})

const individualPeriodPage = (makeTitle, Component) => ({
  makeTitle: props => `Backend: ${props.backend.metadata.label} | ${makeTitle(props)}`,
  actionMenuTitle: 'Authority',
  makeBreadcrumb: backendBreadcrumb(true, makeTitle),
  onBeforeRoute: fetchIndividualBackend(true, true),
  Component,
  mapStateToProps(state, props) {
    const dataset = state.backends.datasets[props.params.backendID]
        , authority = dataset.periodCollections[props.params.authorityID]

    return {
      backend: state.backends.available[props.params.backendID],
      dataset,
      authority,
      period: authority.definitions[props.params.periodID],
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

  /* Backend pages */
  'backend-home': individualBackendPage(
    () => 'Home',
    require('./components/BackendHome')
  ),

  'backend-new-authority': individualBackendPage(
    () => 'Add authority',
    require('./components/AddAuthority')
  ),

  'backend-history': (() => {
    const opts = individualBackendPage(
      () => 'History',
      require('./components/History')
    )

    return Object.assign({}, opts, {
      onBeforeRoute: async (dispatch, params) => {
        await opts.onBeforeRoute(dispatch, params);

        const storage = BackendStorage.fromIdentifier(params.backendID)

        await dispatch(actions.fetchBackendHistory(storage))
      },

      mapStateToProps(state, props) {
        const ret = opts.mapStateToProps(state, props)

        return Object.assign({}, ret, {
          patches: state.backends.patches[props.params.backendID]
        })
      }
    })
  })(),

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

  /* Authority pages */
  'backend-authority-view': individualAuthorityPage(
    props => `View authority (${props.authorityID})`,
    require('./components/Authority')
  ),

  'backend-authority-history': individualAuthorityPage(
    props => `View authority (${props.authorityID})`,
    () => h('h1', 'History')
  ),

  'backend-authority-add-period': individualAuthorityPage(
    () => `Add period`,
    require('./components/AddPeriod')
  ),

  'backend-authority-edit': individualAuthorityPage(
    props => `View authority (${props.authorityID})`,
    () => h('h1', 'Edit authority')
  ),

  /* Period pages */

  'backend-period-view': individualPeriodPage(
    props => `View period (${props.period.id})`,
    require('./components/PeriodView')
  ),

}
