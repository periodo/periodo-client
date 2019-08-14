"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Route } = require('org-shell')
    , BackendAction = require('./backends/actions')
    , AuthAction = require('./auth/actions')
    , PatchAction = require('./patches/actions')
    , LinkedDataAction = require('./linked-data/actions')
    , GraphsAction = require('./graphs/actions')
    , Type = require('union-type')
    , { connect } = require('react-redux')
    , { Box } = require('periodo-ui')
    , { BackendStorage } = require('./backends/types')
    , { handleCompletedAction } = require('org-async-actions')
    , { BackendContext } = require('periodo-ui')

function requireParam(params, key, msg) {
  if (key in params) return;
  throw new Error(msg || `Missing \`${key}\` parameter`);
}

async function throwIfUnsuccessful(promise) {
  const req = await promise
  return handleCompletedAction(req, R.identity, err => {
    throw err
  })
}

function hasEditableBackend({ params }) {
  const storage = BackendStorage.fromIdentifier(params.backendID)

  return storage.isEditable()
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
    },
    /*
    help: {
    },
    */
    'open-backend': {
      label: 'Open backend',
      Component: require('./backends/components/BackendSelect'),
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
      Component: require('./auth/components/Settings'),
    },
  },
  async loadData(props, log, finished) {
    const { dispatch } = props

    await log('Loading backend list', dispatch(BackendAction.GetAllBackends))

    finished()
  },
  async onBeforeRoute(params, redirectTo, { dispatch }) {
    await dispatch(AuthAction.GetAllSettings)
  },
  mapStateToProps(state) {
    return {
      settings: state.auth.settings,
    }
  },
}

const ReadyState = Type({
  Pending: {},
  Success: {
    result: R.T,
  },
  Failure: {
    message: String,
  },
})

function withLoadProgress(resource) {
  return Component => {
    if (!resource.loadData) return Component

    class ResourceLoader extends React.Component {
      constructor() {
        super();

        this.state = {
          loaded: false,
          steps: {},
        }

        this.addStep = this.addStep.bind(this)
      }

      addStep(label, promise) {
        return new Promise(async (resolve, reject) => {
          this.setState(R.set(
            R.lensPath([ 'steps', label ]),
            {
              label,
              progress: ReadyState.Pending,
            }
          ))

          try {
            const result = await promise
            this.setState(R.set(
              R.lensPath([ 'steps', label, 'progress' ]),
              ReadyState.Success(result),
            ))
            resolve(result)
          } catch (e) {
            this.setState(R.set(
              R.lensPath([ 'steps', label, 'progress' ]),
              ReadyState.Failure(e.message)
            ))
            reject(e)
          }
        })
      }

      componentDidMount() {
        resource.loadData(
          this.props,
          this.addStep,
          () => { this.setState({ loaded: true }) })
      }

      render() {
        if (this.state.loaded) return h(Component, this.props)

        return (
          h(Box, Object.values(this.state.steps).map(({ label, progress }, i) =>
            h(Box, {
              key: i,
            }, [
              label,
              '...',
              progress._name,
            ])
          ))
        )
      }
    }

    return ResourceLoader
  }
}

function withBackendContext(Component) {
  function mapStateToProps(state, ownProps) {
    const { backendID } = ownProps.params

    return {
      backend: state.backends.available[backendID],
      dataset: state.backends.datasets[backendID],
    }
  }

  function BackendKnower(props) {
    return h(BackendContext.Provider, {
      value: {
        dataset: props.dataset,
        backend: props.backend,
      },
    }, h(Component, props))
  }

  return connect(mapStateToProps)(BackendKnower)
}

const Backend = {
  label: 'Backend',
  parent: Home,
  resources: {
    'backend-home': {
      label: 'Browse',
      Component: require('./backends/components/BackendHome'),
      async loadData(props, log, finished) {
        const { dispatch, storage } = props

        const gazetteers = log('Loading gazetteers', dispatch(GraphsAction.FetchGazetteers))

        const resp = await dispatch(BackendAction.GetBackendDataset(storage, false))
        const { dataset } = resp.readyState.response

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
    'backend-history': {
      label: 'Changelog',
      Component: require('./backends/components/History'),
      async loadData(props, log, finished) {
        const { dispatch, storage } = props

        await log('Loading backend history', throwIfUnsuccessful(
          dispatch(PatchAction.GetBackendHistory(storage))))

        finished()
      },
      mapStateToProps(state, props) {
        return {
          patches: R.path([ 'patches', 'byBackend', props.params.backendID, 'history' ])(state),
        }
      },
    },
    'backend-add-authority': {
      label: 'Add authority',
      Component: require('./backends/components/AuthorityAddOrEdit'),
      showInMenu: hasEditableBackend,
    },
    'backend-patches': {
      label: 'Patch requests',
      Component: require('./patches/OpenPatches'),
      showInMenu: ({ params }) => {
        const storage = BackendStorage.fromIdentifier(params.backendID)

        return storage.case({
          Web: () => true,
          _: () => false,
        })
      },

      async loadData(props, log, finished) {
        const { dispatch, storage } = props

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
        const { storage } = ownProps
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
              R.over(R.lensProp('updated_by'), urlize),
            ),
            patchRequests
          ),
        }
      },
    },
    'backend-sync': {
      label: 'Sync',
      Component: require('./backends/components/SyncBackend'),
      showInMenu: hasEditableBackend,
    },
    'backend-submit-patch': {
      label: 'Submit patch',
      Component: require('./backends/components/BackendSubmitPatch'),
      showInMenu: hasEditableBackend,
      mapStateToProps(state) {
        return {
          backends: state.backends.available,
        }
      },
    },
    'backend-patch-submissions': {
      label: 'Review submitted patches',
      Component: require('./backends/components/ReviewSubmittedPatches'),
      showInMenu: hasEditableBackend,
      /* FIXME
      async onBeforeRoute(dispatch) {
        const storage = BackendStorage.fromIdentifier(params.backendID)
        await dispatch(actions.getPatchesSubmittedFromBackend(storage))
      },
      */
    },
    'backend-edit': {
      label: 'Settings',
      Component: require('./backends/components/EditBackend'),
    },
  },
  wrappers: [
    withBackendContext,
  ],
  onBeforeRoute(params) {
    requireParam(params, 'backendID');
  },
  async loadData(props, log, finished) {
    const { dispatch, storage } = props

    await log('Loading backend', throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendDataset(storage, false))))

    finished()
  },
  mapStateToProps(state, props) {
    return {
      storage: BackendStorage.fromIdentifier(props.params.backendID),
      backend: state.backends.available[props.params.backendID],
      dataset: state.backends.datasets[props.params.backendID],
    }
  },
}

const ReviewPatch = {
  label: 'Patch request',
  parent: Backend,
  resources: {
    'review-patch': {
      label: 'Review',
      Component: require('./patches/Review'),
    },
  },
  async onBeforeRoute(params) {
    requireParam(params, 'patchURL')
  },
  async loadData(props, log, finished) {
    const { dispatch, storage, params: { patchURL }} = props

    const { backend } = await log('Loading backend', throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendDataset(storage, false))))

    await log('Loading patch', throwIfUnsuccessful(
      dispatch(PatchAction.GetPatchRequest(backend, patchURL))))

    finished()
  },
  mapStateToProps(state, props) {
    const { storage } = props
        , patchURL = new URL(decodeURIComponent(props.params.patchURL), storage.url).href

    const patch = R.path([
      'patches',
      'byBackend',
      storage.asIdentifier(),
      'patchRequests',
      patchURL,
    ])(state)

    return patch || {}
  },
}

const BackendPatch = {
  label: 'Patch',
  parent: Backend,
  resources: {
    'backend-patch': {
      label: 'View',
      Component: require('./backends/components/BackendPatch'),
    },
  },

  async onBeforeRoute(params) {
    requireParam(params, 'patchID')
  },

  async loadData(props, log, finished) {
    const { storage, dispatch, params } = props

    await log('Loading patch', throwIfUnsuccessful(
      dispatch(PatchAction.GetPatch(storage, params.patchID))))

    finished()
  },
  mapStateToProps(state, props) {
    const { storage, params: { patchID }} = props

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
      Component: require('./backends/components/Authority'),
    },

    'authority-edit': {
      label: 'Edit',
      showInMenu: hasEditableBackend,
      Component: require('./backends/components/AuthorityAddOrEdit'),
    },

    'authority-add-period': {
      label: 'Add period',
      showInMenu: hasEditableBackend,
      Component: require('./backends/components/PeriodAddOrEdit'),
    },

    'authority-export': {
      label: 'Export',
      Component: require('./backends/components/Export'),
    },

    'authority-history': {
      label: 'History',
      Component: () => h('h1', 'History'),
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
      authority: props.dataset.authorityByID(props.params.authorityID),
      gazetteers: state.graphs.gazetteers,
    }
  },
}

const Period = {
  label: 'Period',
  parent: Authority,
  resources: {
    'period-view': {
      label: 'View',
      Component: require('./backends/components/PeriodView'),
    },

    'period-edit': {
      label: 'Edit',
      showInMenu: hasEditableBackend,
      Component: require('./backends/components/PeriodAddOrEdit'),
    },

    'period-export': {
      label: 'Export',
      Component: require('./backends/components/Export'),
    },

    'period-history': {
      label: 'History',
      Component: () => h('h1', 'History'),
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

function defineName(fn, value) {
  Object.defineProperty(fn, 'name', { value })
}

function getParents(group) {
  const parents = []

  let cur = group.parent

  while (cur) {
    parents.push(cur);
    cur = cur.parent;
  }

  return parents.reverse()
}

function makeResourceComponent(resource) {
  const Resource = props => {
    return (
      h(Box, {
        css: {
          width: '100%',
          flexGrow: 1,
        },
      }, [
        h(resource.Component, props),
      ])
    )
  }

  Resource.displayName = `Resource:${resource.name}`

  return Resource
}

function registerGroups(groups) {
  Object.entries(groups).forEach(([ key, group ]) => {
    const groupKey = `ResourceGroup:${key}`
        , parents = getParents(group)

    group.name = key;
    group.parents = parents;

    if (group.mapStateToProps) {
      defineName(group.mapStateToProps, `${groupKey}:mapStateToProps`)
    }

    if (group.onBeforeRoute) {
      defineName(group.onBeforeRoute, `${groupKey}:onBeforeRoute`)
    }

    Object.entries(group.resources).forEach(([ key, resource ]) => {
      const resourceKey = `Resource:${key}`

      resource.name = key;
      resource.hierarchy = parents.concat(group, resource)

      if (resource.mapStateToProps) {
        defineName(resource.mapStateToProps, `${resourceKey}:mapStateToProps`)
      }

      if (resource.onBeforeRoute) {
        defineName(resource.onBeforeRoute, `${resourceKey}:onBeforeRoute`)
      }

      const aggregated = R.pipe(
        R.map(R.pick([ 'onBeforeRoute', 'mapStateToProps', 'wrappers', 'loadData' ])),
        R.reduce(
          R.mergeWith(R.flip(R.append)),
          {
            wrappers: [],
            onBeforeRoute: [],
            mapStateToProps: [],
            loadData: [],
          }
        ),
        R.map(R.filter(R.identity))
      )(resource.hierarchy)

      resource.onBeforeRoute = async (...args) => {
        const ret = {}

        for (const fn of aggregated.onBeforeRoute) {
          Object.assign(ret, await fn(...args))
        }

        return ret
      }
      defineName(resource.onBeforeRoute, `${resourceKey}:combinedOnBeforeRoute`)

      resource.mapStateToProps = (state, ownProps) => {
        return aggregated.mapStateToProps.reduce(
          (props, fn) => R.merge(props, fn(state, R.merge(ownProps, props))),
          {}
        )
      }
      defineName(resource.mapStateToProps, `${resourceKey}:combinedMapStateToProps`)

      resource.loadData = async (props, log, finished) => {
        for (const fn of aggregated.loadData) {
          let cont = false

          await fn(props, log, () => { cont = true })

          if (!cont) return
        }

        finished()
      }

      const OriginalComponent = R.pipe(
        withLoadProgress(resource),
        connect(resource.mapStateToProps)
      )(resource.Component)

      resource.Component = R.flatten(aggregated.wrappers).reduce(
        (Component, wrapper) => wrapper(Component, resource),
        OriginalComponent
      )

    })

    module.exports.push(group)
  })
}

module.exports = []

registerGroups({
  Home,
  ReviewPatch,
  Backend,
  BackendPatch,
  Authority,
  // AuthorityPatch,
  Period,
  // PeriodPatch,
})

module.exports = module.exports.reduce((acc, group) =>
  R.merge(
    acc,
    R.map(resource => R.merge(resource, ({
      Component: makeResourceComponent(resource, group),
      makeTitle: () => `${group.label} | ${resource.label}`,
    })), group.resources)
  ),
{}
)
