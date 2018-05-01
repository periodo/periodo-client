"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Route } = require('org-shell')
    , actions = require('./backends/actions')
		, { connect } = require('react-redux')
		, { Flex, Box, Heading } = require('axs-ui')
		, { Link } = require('periodo-ui')
    , { BackendStorage } = require('./backends/types')
    , { handleCompletedAction, getResponse } = require('./typed-actions/utils')

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

const Home = {
  label: 'Home',
  parent: null,
  resources: {
    '': {
      Component: () => h('div'),
      onBeforeRoute(dispatch, params, redirect) {
        redirect(new Route('backends'))
      }
    },
    help: {
    },
    'open-backend': {
      label: 'Backend list',
      Component: require('./backends/components/BackendSelect'),
      async onBeforeRoute(dispatch) {
        await dispatch(actions.listAvailableBackends())
      },
      mapStateToProps: state => ({
        backends: R.pipe(
          R.values,
          R.sortBy(R.path(['metadata', 'accessed'])),
          R.reverse
        )(state.backends.available)
      }),
    },
    'review-patches': {
    }
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
    'backend-add-authority': {
      label: 'Add authority',
      Component: require('./backends/components/AddAuthority'),
    },
    'backend-edit': {
      label: 'Edit',
      Component: require('./backends/components/EditBackend'),
    },
    'backend-sync': {
      label: 'Sync',
      Component: require('./backends/components/SyncBackend'),
      async onBeforeRoute(dispatch) {
        await dispatch(actions.listAvailableBackends())
      }
    },
    'backend-history': {
      label: 'History',
      component: require('./backends/components/History'),
      async onBeforeRoute(dispatch, params) {
        const storage = BackendStorage.fromIdentifier(params.backendID)
        await dispatch(actions.fetchBackendHistory(storage))
      },
      mapStateToProps(state, props) {
        return R.merge(props, {
          patches: state.backends.patches[props.params.backendID]
        })
      },
    },
    'backend-patch': {
      label: 'View patch',
      component: require('./backends/components/History'),
      async onBeforeRoute(dispatch, params) {
        requireParam('patchID')

        const storage = BackendStorage.fromIdentifier(params.backendID)

        await throwIfUnsuccessful(
          dispatch(actions.fetchBackendHistory(storage)))

        const patchReq = await throwIfUnsuccessful(
          dispatch(actions.fetchBackendPatch(storage, params.patchID)))

        return getResponse(patchReq)
      },
      mapStateToProps(state, props) {
        return R.merge(props, {
          patches: state.backends.patches[props.params.backendID]
        })
      }
    }
  },
  async onBeforeRoute(dispatch, params) {
    requireParam(params, 'backendID');

    const storage = BackendStorage.fromIdentifier(params.backendID)

    await throwIfUnsuccessful(
      dispatch(actions.fetchBackend(storage)))
  },
  mapStateToProps(state, props) {
    return {
      backend: state.backends.available[props.params.backendID],
      dataset: state.backends.datasets[props.params.backendID],
    }
  }
}

const Authority = {
  label: 'Authority',
  parent: Backend,
  resources: {
    'authority-view': {
      label: 'View authority',
      Component: require('./backends/components/Authority'),
    },
    'authority-export': {
      label: 'Export authority',
      Component: require('./backends/components/Export'),
    },

    'authority-history': {
      label: 'Authority history',
      Component: () => h('h1', 'History')
    },

    'authority-add-period': {
      label: 'Add period',
      Component: require('./backends/components/PeriodAddOrEdit'),
    },

    'authority-edit': {
      label: 'Edit authority',
      Component: () => h('h1', 'Edit authority'),
    },
  },
  onBeforeRoute(dispatch, params) {
    requireParam(params, 'authorityID');
  },
  mapStateToProps(state, props) {
    return {
      authority: props.dataset.periodCollections[props.params.authorityID]
    }
  }
}

const Period = {
  label: 'Period',
  parent: Authority,
  resources: {
    'period-view': {
      label: 'View period',
      Component: require('./backends/components/PeriodView')
    },

    'period-edit': {
      label: 'Edit period',
      Component: require('./backends/components/PeriodAddOrEdit')
    },

    'period-export': {
      label: 'Export period',
      Component: require('./backends/components/Export'),
    },
  },
  onBeforeRoute(dispatch, params) {
    requireParam(params, 'periodID');
  },
  mapStateToProps(state, props) {
    return {
      period: props.authority.definitions[props.params.periodID]
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
  let Resource = props => {
    return (
      h(Box, { css: { width: '100%', flexGrow: 1, }}, [
        h(Flex, {
          border: 2,
          p: 2,
          mb: 2,
        }, group.parents.concat(group).map((group, i) =>
          h(Box, {
            key: i,
            css: { minWidth: 200 },
          }, [
            h(Heading, { key: 'heading' + '-i', level: 5 }, group.name),
          ].concat(R.values(R.mapObjIndexed((resource, routeName) =>
            h(Link, {
              display: 'block',
              key: routeName,
              route: Route(routeName, props.params),
              css: Object.assign({}, routeName === props.activeResourceName && {
                backgroundColor: '#ccc',
              }),
            }, routeName),
            group.resources
          ))))
        )),

        h(resource.Component, props),
      ])
    )
  }

  Resource = connect(resource.mapStateToProps)(Resource)

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
      )(parents.concat(group, resource))

      resource.onBeforeRoute = async (...args) => {
        const ret = {}

        for (const fn of aggregated.onBeforeRoute) {
          Object.assign(ret, await fn(...args))
        }

        return ret
      }
      defineName(resource.onBeforeRoute, `${resourceKey}:combinedOnBeforeRoute`)

      resource.mapStateToProps = (state, ownProps) =>
        aggregated.mapStateToProps.reduce(
          (props, fn) => R.merge(props, fn(state, props)),
          ownProps)
      defineName(resource.mapStateToProps, `${resourceKey}:combinedMapStateToProps`)

    }, group.resources)

    module.exports.push(group)

  } , groups)
}

module.exports = []

registerGroups({
  Home,
  Backend,
  Authority,
  Period,
})

module.exports = module.exports.reduce((acc, group) =>
  R.merge(
    acc,
    R.map(resource => ({
      Component: makeResourceComponent(resource, group),
      onBeforeRoute: resource.onBeforeRoute,
      makeTitle: () => `${group.label} | ${resource.label}`,
    }), group.resources)
  ),
  {}
)
