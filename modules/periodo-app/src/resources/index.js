"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Route } = require('org-shell')
    , { connect } = require('react-redux')
    , { Box } = require('periodo-ui')
    , { withLoadProgress, withReduxState } = require('./wrappers')
    , resourceGroups = require('./resources')

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
  const ret = []

  Object.entries(groups).forEach(([ key, group ]) => {
    const groupKey = `ResourceGroup:${key}`
        , parents = getParents(group)

    group.name = key;
    group.parents = parents;

    if (group.mapStateToProps) {
      defineName(group.mapStateToProps, `${groupKey}:mapStateToProps`)
    }

    if (group.modifyMenuLinkParams) {
      defineName(group.modifyMenuLinkParams, `${groupKey}:modifyMenuLinkParams`)
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
        connect(resource.mapStateToProps),
        withLoadProgress(resource),
        withReduxState
      )(resource.Component)

      resource.Component = R.flatten(aggregated.wrappers).reduce(
        (Component, wrapper) => wrapper(Component, resource),
        OriginalComponent
      )

    })

    ret.push(group)
  })

  return ret
}


const resources = {}

registerGroups(resourceGroups).forEach(group => {
  Object.entries(group.resources).forEach(([ key, resource ]) => {
    resources[key] = {
      ...resource,
      Component: makeResourceComponent(resource, group),
      makeTitle: () => `${group.label} | ${resource.label}`,
    }
  })
})

function getRouteGroups(resource, props) {
  const hierarchy = resource.hierarchy || resources[''].hierarchy

  try {
    return hierarchy.slice(0, -1).map(group => ({
      label: group.label,
      routes: Object.entries(group.resources).reduce(
        (acc, [ routeName, resource ]) =>
          (resource.showInMenu || R.T)(props)
            ? [ ...acc, {
              route: new Route(
                routeName,
                (group.modifyMenuLinkParams || R.identity)(props.params)
              ),
              label: resource.label,
            }]
            : acc
        , []),
    }))
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e)
    return []
  }
}


module.exports = {
  resources,
  getRouteGroups,
}
