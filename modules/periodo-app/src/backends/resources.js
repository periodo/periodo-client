"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , { Route } = require('org-shell')
    , { Link, DropdownMenuItem, DropdownMenuSeparator } = require('periodo-ui')
    , utils = require('periodo-utils')
    , actions = require('./actions')
    , { BackendStorage } = require('./types')

const backendRoute = props => name =>
  Route(`backend-${name}`, {
    backendID: props.backend.asIdentifier()
  })

const authorityRoute = props => name =>
  Route(`authority-${name}`, {
    backendID: props.backend.asIdentifier(),
    authorityID: props.authority.id,
  })

const periodRoute = props => name =>
  Route(`period-${name}`, {
    backendID: props.backend.asIdentifier(),
    authorityID: props.authority.id,
    periodID: props.period.id,
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

const backendBreadcrumb = makeTitle => props => {
  const { backend, period, authority } = props
      , finalTitle = makeTitle(props)

  const crumbs = [
    h(Link, { route: Route('open-backend'), }, 'Backends'),
  ]

  if (authority || period) {
    crumbs.push(
      h(Link, { route: backendRoute(props)('home') }, backend.metadata.label)
    )
  }

  if (period) {
    crumbs.push(
      h(Link, { route: authorityRoute(props)('view') }, utils.authority.displayTitle(authority))
    )
  }

  crumbs.push(finalTitle)

  return crumbs;
}

const backendRootActions = () =>
  [
    h(DropdownMenuItem, { value: Route('open-backend') }, 'Open backend'),
    h(DropdownMenuItem, { value: Route('new-backend') }, 'Add backend'),
  ]

const individualBackendPage = (makeTitle, Component) => ({
  actionMenuTitle: 'Backend',
  makeActionMenu(props) {
    // FIXME: Hack :(. Needs to be this way for the time being to delete backends.
    if (!props.backend) return []

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
  makeBreadcrumb: backendBreadcrumb(makeTitle),
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
  actionMenuTitle: 'Authority',
  makeActionMenu(props) {
    const route = authorityRoute(props)

    return [
      h(DropdownMenuItem, { value: route('view') }, 'Details'),
      h(DropdownMenuItem, { value: route('export') }, 'Export'),
      h(DropdownMenuItem, { value: route('history') }, 'History'),
      h(DropdownMenuItem, { value: route('edit') }, 'Edit'),
      h(DropdownMenuItem, { value: route('add-period') }, 'Add period'),
    ]
  },
  makeBreadcrumb: backendBreadcrumb(makeTitle),
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
  actionMenuTitle: 'Period',
  makeActionMenu(props) {
    const route = periodRoute(props)

    return [
      h(DropdownMenuItem, { value: route('edit') }, 'Edit'),
      h(DropdownMenuItem, { value: route('export') }, 'Export'),
    ]
  },
  makeBreadcrumb: backendBreadcrumb(makeTitle),
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
    title: () => `Add backend`,
    makeActionMenu: backendRootActions,
    actionMenuTitle: 'Backend list',
    makeBreadcrumb: () => ['Add backend'],
    mapStateToProps: () => ({}),
    Component: require('./components/AddBackend')
  },

  /* Backend pages */
  'backend-home': individualBackendPage(
    props => `Home (${props.backend.metadata.label})`,
    require('./components/BackendHome')
  ),

  'backend-new-authority': individualBackendPage(
    props => `Add authority (${props.backend.metadata.label})`,
    require('./components/AddAuthority')
  ),

  'backend-history': (() => {
    const opts = individualBackendPage(
    props => `History (${props.backend.metadata.label})`,
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
  'authority-view': individualAuthorityPage(
    props => `View authority (${utils.authority.displayTitle(props.authority)})`,
    require('./components/Authority')
  ),

  'authority-export': individualAuthorityPage(
    props => `Export authority (${utils.authority.displayTitle(props.authority)})`,
    require('./components/Export')
  ),


  'authority-history': individualAuthorityPage(
    props => `View authority (${props.authorityID})`,
    () => h('h1', 'History')
  ),

  'authority-add-period': individualAuthorityPage(
    () => `Add period`,
    require('./components/PeriodAddOrEdit')
  ),

  'authority-edit': individualAuthorityPage(
    props => `Edit authority (${utils.authority.displayTitle(props.authority)})`,
    () => h('h1', 'Edit authority')
  ),

  /* Period pages */

  'period-view': individualPeriodPage(
    props => `View period (${props.period.label})`,
    require('./components/PeriodView')
  ),

  'period-edit': individualPeriodPage(
    props => `Edit period (${props.period.label})`,
    require('./components/PeriodAddOrEdit')
  ),

  'period-export': individualPeriodPage(
    props => `Export period (${props.period.label})`,
    require('./components/Export')
  ),

}
