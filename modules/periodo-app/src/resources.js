"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Route } = require('org-shell')
    , BackendAction = require('./backends/actions')
    , AuthAction = require('./auth/actions')
    , PatchAction = require('./patches/actions')
    , LinkedDataAction = require('./linked-data/actions')
    , { Box } = require('periodo-ui')
    , { BackendStorage } = require('./backends/types')
    , { handleCompletedAction } = require('org-async-actions')

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

function hasEditableBackend({ backend }) {
  return backend.isEditable()
}

const Home = {
  label: 'Home',
  parent: null,
  resources: {
    '': {
      Component: () => h('div'),
      onBeforeRoute(dispatch, params, redirect) {
        redirect(new Route('open-backend'))
      }
    },
    /*
    help: {
    },
    */
    'open-backend': {
      label: 'Open backend',
      Component: require('./backends/components/BackendSelect'),
      async onBeforeRoute(dispatch) {
        await dispatch(BackendAction.GetAllBackends)
      },
      mapStateToProps: state => ({
        backends: R.pipe(
          R.values,
          R.sortBy(R.path(['metadata', 'accessed'])),
          R.reverse
        )(state.backends.available)
      }),
    },
    'open-patches': {
      label: 'Review patches',
      Component: require('./patches/OpenPatches'),
      async onBeforeRoute(dispatch) {
        const { patches } = await throwIfUnsuccessful(
          dispatch(PatchAction.GetOpenServerPatches)
        )


        await dispatch(LinkedDataAction.FetchORCIDs(
          patches.map(R.prop('created_by'))
        ))

        return { patchRequests: patches }
      },
      mapStateToProps: (state, ownProps) => {
        const { nameByORCID } = state.linkedData

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
            ownProps.extra.patchRequests
          )
        }
      }
    },
    'settings': {
      label: 'Settings',
      Component: require('./auth/components/Settings'),
    },
  },
  async onBeforeRoute(dispatch) {
    await dispatch(AuthAction.GetAllSettings)
  },
  mapStateToProps(state) {
    return {
      settings: state.auth.settings,
    }
  }
}

const ReviewPatch = {
  label: 'Review patch',
  parent: Home,
  resources: {
    'review-patch': {
      label: 'Review patch',
      Component: require('./patches/Review'),
    }
  },
  async onBeforeRoute(dispatch, params) {
    requireParam(params, 'patchURL')

    const patch = await throwIfUnsuccessful(
      dispatch(PatchAction.GetLocalPatch(
        decodeURIComponent(params.patchURL)))
      )

    return { patch }
  },
  mapStateToProps(state, props) {
    return Object.assign({}, props.extra.patch)
  }
}

const Backend = {
  label: 'Backend',
  parent: Home,
  resources: {
    'backend-home': {
      label: 'Browse',
      Component: require('./backends/components/BackendHome'),
    },
    'backend-edit': {
      label: 'Configure',
      Component: require('./backends/components/EditBackend'),
    },
    'backend-add-authority': {
      label: 'Add authority',
      Component: require('./backends/components/AddAuthority'),
      showInMenu: hasEditableBackend,
    },
    'backend-sync': {
      label: 'Sync',
      Component: require('./backends/components/SyncBackend'),
      showInMenu: hasEditableBackend,
      async onBeforeRoute(dispatch) {
        await dispatch(BackendAction.GetAllBackends)
      }
    },
    'backend-submit-patch': {
      label: 'Submit patch',
      Component: require('./backends/components/BackendSubmitPatch'),
      showInMenu: hasEditableBackend,
      async onBeforeRoute(dispatch) {
        await dispatch(BackendAction.GetAllBackends)
      }
    },
    'backend-patch-submissions': {
      label: 'Review submitted patches',
      Component: require('./backends/components/ReviewSubmittedPatches'),
      showInMenu: hasEditableBackend,
      async onBeforeRoute(dispatch) {
        /*
        const storage = BackendStorage.fromIdentifier(params.backendID)
        await dispatch(actions.getPatchesSubmittedFromBackend(storage))
        */
      }
    },
    'backend-history': {
      label: 'History',
      Component: require('./backends/components/History'),
      async onBeforeRoute(dispatch, params) {
        const storage = BackendStorage.fromIdentifier(params.backendID)

        const changes = await throwIfUnsuccessful(
          dispatch(BackendAction.GetBackendHistory(storage)))
      },
      mapStateToProps(state, props) {
        return {
          patches: state.backends.patches[props.params.backendID]
        }
      },
    },
  },
  async onBeforeRoute(dispatch, params) {
    requireParam(params, 'backendID');

    const storage = BackendStorage.fromIdentifier(params.backendID)

    await throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendDataset(storage, false)))
  },
  mapStateToProps(state, props) {
    return {
      backend: state.backends.available[props.params.backendID],
      dataset: state.backends.datasets[props.params.backendID],
    }
  }
}

const BackendPatch = {
  label: 'Backend patch',
  parent: Backend,
  resources: {
    'backend-patch': {
      label: 'View patch',
      Component: require('./backends/components/BackendPatch'),
      showInMenu: hasEditableBackend,
    }
  },
  async onBeforeRoute(dispatch, params) {
    requireParam(params, 'patchID')

    const storage = BackendStorage.fromIdentifier(params.backendID)

    await throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendHistory(storage)))

    const patchReq = await throwIfUnsuccessful(
      dispatch(BackendAction.GetBackendPatch(storage, params.patchID)))

    return patchReq
  },
  mapStateToProps(state, props) {
    return {
      patches: state.backends.patches[props.params.backendID]
    }
  }
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
      Component: () => h('h1', 'Edit authority'),
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
      Component: () => h('h1', 'History')
    },
  },
  onBeforeRoute(dispatch, params) {
    requireParam(params, 'authorityID');
  },
  mapStateToProps(state, props) {
    return {
      authority: props.dataset.authorities[props.params.authorityID]
    }
  }
}

const Period = {
  label: 'Period',
  parent: Authority,
  resources: {
    'period-view': {
      label: 'View',
      Component: require('./backends/components/PeriodView')
    },

    'period-edit': {
      label: 'Edit',
      showInMenu: hasEditableBackend,
      Component: require('./backends/components/PeriodAddOrEdit')
    },

    'period-export': {
      label: 'Export',
      Component: require('./backends/components/Export'),
    },

    'period-history': {
      label: 'History',
      Component: () => h('h1', 'History')
    },
  },
  onBeforeRoute(dispatch, params) {
    requireParam(params, 'periodID');
  },
  mapStateToProps(state, props) {
    return {
      period: props.authority.periods[props.params.periodID]
    }
  }
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

function makeResourceComponent(resource, group) {
  const Resource = props => {
    return (
      h(Box, { css: { width: '100%', flexGrow: 1, }}, [
        h(resource.Component, props),
      ])
    )
  }

  Resource.displayName = `Resource:${resource.name}`

  return Resource
}

function registerGroups(groups) {
  R.mapObjIndexed((group, key) => {
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

    R.mapObjIndexed((resource, key) => {
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
        R.map(R.pick(['onBeforeRoute', 'mapStateToProps'])),
        R.reduce(
          R.mergeWith(R.flip(R.append)),
          {
            onBeforeRoute: [],
            mapStateToProps: [],
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

    }, group.resources)

    module.exports.push(group)

  } , groups)
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
