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
    , { ReactReduxContext, connect } = require('react-redux')
    , { Box } = require('periodo-ui')
    , { BackendStorage } = require('./backends/types')
    , { handleCompletedAction } = require('org-async-actions')
    , { BackendContext, LoadingIcon } = require('periodo-ui')

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
  return params.backendID.startsWith('local-')
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
      label: 'Data sources',
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

    await log('Loading data source list', throwIfUnsuccessful(
      dispatch(BackendAction.GetAllBackends)))

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
          if (this._unmounted) return
          this.setState(R.set(
            R.lensPath([ 'steps', label ]),
            {
              label,
              progress: ReadyState.Pending,
            }
          ))

          try {
            const result = await promise
            if (this._unmounted) return
            this.setState(R.set(
              R.lensPath([ 'steps', label, 'progress' ]),
              ReadyState.Success(result),
            ))
            resolve(result)
          } catch (e) {
            if (this._unmounted) return
            this.setState(R.set(
              R.lensPath([ 'steps', label, 'progress' ]),
              ReadyState.Failure(e.message)
            ))
            reject(e)
          }
        })
      }

      componentWillUnmount() {
        this._unmounted = true
      }

      componentDidMount() {
        const load = Promise.resolve(
          resource.loadData(
            this.props,
            this.addStep,
            () => {
              if (this._unmounted) return
              this.setState({ loaded: true })
            }))

        load.catch(e => {
          this.setState({
            error: e,
          })
        })

        setTimeout(() => {
          if (this._unmounted) return
          this.setState({ showLoading: true })
        }, 50)
      }

      render() {
        if (this.state.error) throw this.state.error
        if (this.state.loaded) return h(Component, this.props)

        if (!this.state.showLoading) return null

        return (
          h(Box, Object.values(this.state.steps).map(({ label, progress }, i) =>
            h('div', {
              key: i,
              style: {
                display: 'grid',
                gridTemplateColumns: 'minmax(auto, 22px) 1fr',
                marginBottom: '.33em',
                fontSize: '16px',
              },
            }, [
              h('div', {}, progress.case({
                Pending: () => h(LoadingIcon),
                Success: () => h('span', {
                  style: {
                    color: 'limegreen',
                    fontWeight: 'bold',
                  },
                }, '✓'),
                Failure: () => h('span', {
                  style: {
                    color: 'red',
                    fontWeight: 'bold',
                  },
                }, '✕'),
              })),

              h('div', label),
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

const Backend = {
  label: 'Data source',
  parent: Home,
  resources: {
    'backend-home': {
      label: 'Browse',
      Component: require('./backends/components/BackendHome'),
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
    'backend-add-authority': {
      label: 'Add authority',
      Component: require('./backends/components/AuthorityAddOrEdit'),
      showInMenu: hasEditableBackend,
    },
    'backend-patches': {
      label: 'Review submitted changes',
      Component: require('./patches/OpenPatches'),
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
              R.over(R.lensProp('updated_by'), urlize),
            ),
            patchRequests
          ),
        }
      },
    },
    'backend-sync': {
      label: 'Import changes',
      Component: require('./backends/components/SyncBackend'),
      showInMenu: hasEditableBackend,
      mapStateToProps(state) {
        return {
          backends: state.backends.available,
        }
      },
    },
    'backend-submit-patch': {
      label: 'Submit changes',
      Component: require('./backends/components/BackendSubmitPatch'),
      showInMenu: hasEditableBackend,
      mapStateToProps(state) {
        return {
          backends: state.backends.available,
        }
      },
    },
    'backend-patch-submissions': {
      label: 'Review submitted changes',
      Component: require('./backends/components/ReviewSubmittedPatches'),
      showInMenu: hasEditableBackend,
      /* FIXME
      async onBeforeRoute(dispatch) {
        const storage = BackendStorage.fromIdentifier(params.backendID)
        await dispatch(actions.getPatchesSubmittedFromBackend(storage))
      },
      */
    },
    'backend-history': {
      label: 'History',
      Component: require('./backends/components/History'),
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
    const { dispatch, params: { patchURL }} = props
        , storage = getCurrentBackendStorage(props)

    const { backend } = await log('Loading data source', throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendDataset(storage, false))))

    await log('Loading patch', throwIfUnsuccessful(
      dispatch(PatchAction.GetPatchRequest(backend, patchURL))))

    finished()
  },
  mapStateToProps(state, props) {
    const storage = getCurrentBackendStorage(props)
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
      Component: require('./backends/components/Authority'),
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
      showInMenu: hasEditableBackend,
      Component: require('./backends/components/AuthorityAddOrEdit'),
    },

    'authority-add-period': {
      label: 'Add period',
      showInMenu: hasEditableBackend,
      Component: require('./backends/components/PeriodAddOrEdit'),
    },

    'authority-history': {
      label: 'History',
      showInMenu({ params }) {
        return (
          params.backendID.startsWith('web-') ||
          params.backendID.startsWith('local-')
        )
      },
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
      authority: props.dataset && props.dataset.authorityByID(props.params.authorityID),
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

    'period-history': {
      label: 'History',
      showInMenu({ params }) {
        return (
          params.backendID.startsWith('web-') ||
          params.backendID.startsWith('local-')
        )
      },
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

      function withReduxState(Component) {
        function ReduxStoreComponent(props) {
          return (
            h(ReactReduxContext.Consumer, {}, ({ store }) =>
              h(Component, {
                ...props,
                getState: store.getState,
                dispatch: store.dispatch,
              })
            )
          )
        }

        return ReduxStoreComponent
      }

      const OriginalComponent = R.pipe(
        connect(resource.mapStateToProps),
        withLoadProgress(resource),
        withReduxState,
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
