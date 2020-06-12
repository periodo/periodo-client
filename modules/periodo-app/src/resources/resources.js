"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Route } = require('org-shell')
    , BackendAction = require('../backends/actions')
    , AuthAction = require('../auth/actions')
    , PatchAction = require('../patches/actions')
    , LinkedDataAction = require('../linked-data/actions')
    , GraphsAction = require('../graphs/actions')
    , { BackendStorage } = require('../backends/types')
    , { handleCompletedAction } = require('org-async-actions')
    , { withBackendContext } = require('./wrappers')


// Given a set of props, returns whether the included backend is local
// (i.e. editable)
function isLocalBackend({ params }) {
  return params.backendID.startsWith('local-')
}

// Throw an error if a a certain key is not in an object
function requireParam(params, key, msg) {
  if (key in params) return;
  throw new Error(msg || `Missing \`${key}\` parameter`);
}

// Return the value of a dispatched org-async-action if it successful,
// otherwise rethrow the error
async function throwIfUnsuccessful(promise) {
  const req = await promise
  return handleCompletedAction(req, R.identity, err => {
    throw err
  })
}

// Check whether a backend has authentication credentials, on the condition
// that it is a Web backend
function checkServerAuthentication(log, props) {
  const storage = getCurrentBackendStorage(props)

  return storage.case({
    Web: () => log('Checking server authentication',
      props.dispatch(BackendAction.CheckServerAuthentication(storage))),
    _: () => Promise.resolve(),
  })
}

// Given some props (that would be given to `loadData` or `mapStateToProps`,
// return the backend storage indicated by the params
function getCurrentBackendStorage(props) {
  const { params, getState } = props

  let storage

  const backend = R.path([
    'backends',
    'available',
    params.backendID,
  ], getState())

  if (backend) {
    storage = backend.storage
  }

  if (!storage && params.backendID.startsWith('web-')) {
    storage = BackendStorage.fromIdentifier(params.backendID)
  }

  return storage
}



const Home = {
  label: 'Home',
  parent: null,
  resources: {
    '': {
      Component: () => h('div'),
      onBeforeRoute(params, redirectTo) {
        redirectTo(new Route('open-backend'))
      },
      showInMenu: () => false,
    },
    'open-backend': {
      label: 'Data sources',
      Component: require('../backends/components/BackendSelect'),
      mapStateToProps: state => ({
        backends: R.pipe(
          R.values,
          R.sortBy(R.path([ 'metadata', 'accessed' ])),
          R.reverse
        )(state.backends.available),
      }),
    },
    'settings': {
      label: 'Settings',
      Component: require('../auth/components/Settings'),
    },
  },
  async loadData(props, log, finished) {
    const { dispatch } = props

    await log('Loading data source list', throwIfUnsuccessful(
      dispatch(BackendAction.GetAllBackends)))

    finished()
  },
  async onBeforeRoute(params, redirectTo, { dispatch }) {
    await dispatch(AuthAction.GetAllSettings)
  },

  modifyMenuLinkParams() {
    return {}
  },

  mapStateToProps(state) {
    return {
      settings: state.auth.settings,
    }
  },
}

const Backend = {
  label: 'Data source',
  parent: Home,
  resources: {
    'backend-home': {
      label: 'Browse periods',
      Component: require('../backends/components/BackendHome'),
      async loadData(props, log, finished) {
        const { dispatch, getState } = props
            , storage = getCurrentBackendStorage(props)

        const gazetteers = log('Loading gazetteers', throwIfUnsuccessful(
          dispatch(GraphsAction.FetchGazetteers)))

        const dataset = R.path([
          'backends',
          'datasets',
          storage.asIdentifier(),
        ], getState())

        const sorts = log('Initializing sorts', Promise.all([
          dataset.cachedSort([], 'label'),
          dataset.cachedSort([], 'start'),
        ]))

        await Promise.all([ gazetteers, sorts ])

        finished()
      },
      mapStateToProps(state) {
        return {
          gazetteers: state.graphs.gazetteers,
        }
      },
    },
    'backend-authorities': {
      label: 'Browse authorities',
      Component: require('../backends/components/BrowseAuthorities'),
      async loadData(props, log, finished) {
        const { dispatch } = props
            , storage = getCurrentBackendStorage(props)

        await log('Loading data source history', throwIfUnsuccessful(
          dispatch(PatchAction.GetBackendHistory(storage))))

        finished()
      },
      mapStateToProps(state, props) {
        const { dataset } = props
            , patches = R.path([ 'patches', 'byBackend', props.params.backendID, 'history' ])(state)

        if (!dataset) return {}

        const editedAuthorities = new Set(patches.reduce((acc, patch) =>
          [ ...acc, ...patch.affectedItems.authorities ],
        []))

        // FIXME: Must add logic for mapping IDs for local items that have been
        // accepted and given permalinks

        return {
          authorityIDs: editedAuthorities,
        }
      },
    },
    'backend-add-authority': {
      label: 'Add authority',
      Component: require('../backends/components/AuthorityAddOrEdit'),
      showInMenu: isLocalBackend,
    },
    'backend-patches': {
      label: 'Review submitted changes',
      Component: require('../patches/OpenPatches'),
      showInMenu: ({ params }) => {
        return params.backendID.startsWith('web-')
      },

      async loadData(props, log, finished) {
        const { dispatch } = props
            , storage = getCurrentBackendStorage(props)

        const resp = await log('Loading server patches',
          throwIfUnsuccessful(dispatch(PatchAction.GetPatchRequestList(storage))))

        const { patchRequests } = resp

        const creators = new Set(patchRequests.map(R.prop('created_by')))
            , mergers = new Set(patchRequests.map(R.prop('updated_by')))

        const allORCIDs = [ ...new Set([ ...creators, ...mergers ]) ]
          .filter(R.startsWith('http'))

        await log('Loading ORCIDs',
          dispatch(LinkedDataAction.FetchORCIDs(allORCIDs)))

        finished()
      },

      mapStateToProps: (state, ownProps) => {
        const storage = getCurrentBackendStorage(ownProps)
            , { nameByORCID } = state.linkedData

        const patchRequests = R.path([
          'patches',
          'byBackend',
          storage.asIdentifier(),
          'patchRequestList',
        ])(state) || []

        const urlize = url => ({
          label: nameByORCID[url],
          url,
        })

        return {
          patchRequests: R.map(
            R.pipe(
              R.over(R.lensProp('created_by'), urlize),
              R.over(R.lensProp('updated_by'), urlize)
            ),
            patchRequests
          ),
        }
      },
    },
    'backend-sync': {
      label: 'Import changes',
      Component: require('../backends/components/SyncBackend'),
      showInMenu: isLocalBackend,
      mapStateToProps(state) {
        return {
          backends: state.backends.available,
        }
      },
    },
    'backend-submit-patch': {
      label: 'Submit changes',
      Component: require('../backends/components/BackendSubmitPatch'),
      showInMenu: isLocalBackend,
      async loadData(props, log, finished) {
        await checkServerAuthentication(log, props)

        finished()
      },
      mapStateToProps(state) {
        return {
          backends: state.backends.available,
        }
      },
    },
    'backend-history': {
      label: 'History',
      Component: require('../backends/components/History'),
      showInMenu({ params }) {
        return (
          params.backendID.startsWith('web-') ||
          params.backendID.startsWith('local-')
        )
      },

      async loadData(props, log, finished) {
        const { dispatch } = props
            , storage = getCurrentBackendStorage(props)

        await log('Loading data source history', throwIfUnsuccessful(
          dispatch(PatchAction.GetBackendHistory(storage))))

        finished()
      },
      mapStateToProps(state, props) {
        return {
          patches: R.path([ 'patches', 'byBackend', props.params.backendID, 'history' ])(state),
        }
      },
    },
    'backend-edit': {
      label: 'Settings',
      Component: require('../backends/components/EditBackend'),
      async loadData(props, log, finished) {
        if (props.params.backendID.startsWith('web-')) {
          await checkServerAuthentication(log, props)
        }

        finished()
      },
      mapStateToProps(state, props) {
        return {
          authState: state.backends.authentication[props.params.backendID] || {},
        }
      },
    },
  },
  wrappers: [
    withBackendContext,
  ],
  onBeforeRoute(params) {
    requireParam(params, 'backendID');
  },
  async loadData(props, log, finished) {
    const { dispatch } = props
        , storage = getCurrentBackendStorage(props)

    await log('Loading data source', throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendDataset(storage, false))))

    finished()
  },
  mapStateToProps(state, props) {
    return {
      backend: state.backends.available[props.params.backendID],
      dataset: state.backends.datasets[props.params.backendID],
    }
  },
  modifyMenuLinkParams(params) {
    // eslint-disable-next-line no-unused-vars
    const { periodID, authorityID, ...rest } = params
    return rest
  },
}

const ReviewPatch = {
  label: 'Submitted change',
  parent: Backend,
  resources: {
    'review-patch': {
      label: 'Review',
      Component: require('../patches/Review'),
    },
  },
  async onBeforeRoute(params) {
    requireParam(params, 'patchURL')
  },
  async loadData(props, log, finished) {
    const { dispatch, params: { patchURL }} = props
        , storage = getCurrentBackendStorage(props)

    const { backend } = await log('Loading data source', throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendDataset(storage, false))))

    const serverResp = checkServerAuthentication(log, props)

    const { patch } = await log('Loading patch', throwIfUnsuccessful(
      dispatch(PatchAction.GetPatchRequest(backend, patchURL))))

    const orcidsResp = log('Loading ORCIDs',
      dispatch(LinkedDataAction.FetchORCIDs([ ...new Set([
        patch.created_by,
        patch.updated_by,
      ]) ]))
    )

    await Promise.all([ serverResp, orcidsResp ])

    finished()
  },
  mapStateToProps(state, props) {
    const storage = getCurrentBackendStorage(props)
        , { nameByORCID } = state.linkedData

    const patchURL = new URL(
      decodeURIComponent(props.params.patchURL), storage.url
    ).href

    const patch = R.path([
      'patches',
      'byBackend',
      storage.asIdentifier(),
      'patchRequests',
      patchURL,
    ])(state)

    const urlize = url => ({
      label: nameByORCID[url],
      url,
    })

    if (patch) {
      patch.patch.created_by = urlize(patch.patch.created_by)
      patch.patch.updated_by = urlize(patch.patch.updated_by)
    }

    return patch || {}
  },
}

const BackendPatch = {
  label: 'Change',
  parent: Backend,
  resources: {
    'backend-patch': {
      label: 'View',
      Component: require('../backends/components/BackendPatch'),
    },
  },

  async onBeforeRoute(params) {
    requireParam(params, 'patchID')
  },

  async loadData(props, log, finished) {
    const { dispatch, params } = props
        , storage = getCurrentBackendStorage(props)

    await log('Loading data source history', throwIfUnsuccessful(
      dispatch(PatchAction.GetBackendHistory(storage))))


    await log('Loading patch', throwIfUnsuccessful(
      dispatch(PatchAction.GetPatch(storage, params.patchID))))

    finished()
  },
  mapStateToProps(state, props) {
    const storage = getCurrentBackendStorage(props)
        , { params: { patchID }} = props

    return {
      patch: R.path([
        'patches',
        'byBackend',
        storage.asIdentifier(),
        'patches',
        patchID,
      ])(state),
    }
  },
}

const Authority = {
  label: 'Authority',
  parent: Backend,
  resources: {
    'authority-view': {
      label: 'View',
      Component: require('../backends/components/AuthorityView'),
      async loadData(props, log, finished) {
        const { dispatch, getState } = props
            , storage = getCurrentBackendStorage(props)

        const gazetteers = log('Loading gazetteers', throwIfUnsuccessful(
          dispatch(GraphsAction.FetchGazetteers)))

        const dataset = R.path([
          'backends',
          'datasets',
          storage.asIdentifier(),
        ], getState())

        const sorts = log('Initializing sorts', Promise.all([
          dataset.cachedSort([], 'label'),
          dataset.cachedSort([], 'start'),
        ]))

        await Promise.all([ gazetteers, sorts ])

        finished()
      },
      mapStateToProps(state) {
        return {
          gazetteers: state.graphs.gazetteers,
        }
      },
    },

    'authority-edit': {
      label: 'Edit',
      showInMenu: isLocalBackend,
      Component: require('../backends/components/AuthorityAddOrEdit'),
    },

    'authority-add-period': {
      label: 'Add period',
      showInMenu: isLocalBackend,
      Component: require('../backends/components/PeriodAddOrEdit'),
    },

    'authority-history': {
      label: 'History',
      showInMenu({ params }) {
        return (
          params.backendID.startsWith('web-') ||
          params.backendID.startsWith('local-')
        )
      },
      async loadData(props, log, finished) {
        const { dispatch } = props
            , storage = getCurrentBackendStorage(props)

        await log('Loading data source history', throwIfUnsuccessful(
          dispatch(PatchAction.GetBackendHistory(storage))))

        finished()
      },
      mapStateToProps(state, props) {
        const { authorityID } = props.params

        const allPatches = R.path([
          'patches',
          'byBackend',
          props.params.backendID,
          'history',
        ])(state)

        const authorityPatches = allPatches.filter(patch =>
          patch.affectedItems.authorities.includes(authorityID))

        return {
          patches: authorityPatches,
        }
      },
      Component: require('../backends/components/History'),
    },
  },
  onBeforeRoute(params) {
    requireParam(params, 'authorityID');
  },
  async loadData(props, log, finished) {
    const { dispatch } = props

    await log('Loading gazetteers', throwIfUnsuccessful(
      dispatch(GraphsAction.FetchGazetteers)))

    finished()
  },
  mapStateToProps(state, props) {
    return {
      authority: props.dataset && props.dataset.authorityByID(props.params.authorityID),
      gazetteers: state.graphs.gazetteers,
    }
  },
  modifyMenuLinkParams(params) {
    // eslint-disable-next-line no-unused-vars
    const { periodID, ...rest } = params
    return rest
  },
}

const Period = {
  label: 'Period',
  parent: Authority,
  resources: {
    'period-view': {
      label: 'View',
      Component: require('../backends/components/PeriodView'),
    },

    'period-edit': {
      label: 'Edit',
      showInMenu: isLocalBackend,
      Component: require('../backends/components/PeriodAddOrEdit'),
    },

    'period-history': {
      label: 'History',
      showInMenu({ params }) {
        return (
          params.backendID.startsWith('web-') ||
          params.backendID.startsWith('local-')
        )
      },
      async loadData(props, log, finished) {
        const { dispatch } = props
            , storage = getCurrentBackendStorage(props)

        await log('Loading data source history', throwIfUnsuccessful(
          dispatch(PatchAction.GetBackendHistory(storage))))

        finished()
      },
      mapStateToProps(state, props) {
        const { periodID } = props.params

        const allPatches = R.path([
          'patches',
          'byBackend',
          props.params.backendID,
          'history',
        ])(state)

        const periodPatches = allPatches.filter(patch =>
          patch.affectedItems.periods.includes(periodID))

        return {
          patches: periodPatches,
        }
      },
      Component: require('../backends/components/History'),
    },
  },
  async onBeforeRoute(params, redirectTo, { dispatch }) {
    requireParam(params, 'periodID')
    await throwIfUnsuccessful(dispatch(GraphsAction.FetchGazetteers))
  },
  mapStateToProps(state, props) {
    return {
      period: props.authority.periods[props.params.periodID],
      gazetteers: state.graphs.gazetteers,
    }
  },
}

module.exports = {
  Home,
  Backend,
  ReviewPatch,
  BackendPatch,
  Authority,
  Period,
}
