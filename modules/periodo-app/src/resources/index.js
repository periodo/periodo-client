"use strict";

const R = require('ramda')
    , { Route } = require('org-shell')
    , { connect } = require('react-redux')
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

const aggregatedResourceAttributes = {
  wrappers: {
    combine: args => args.flat(),
  },

  mapStateToProps: {
    combine: fns => (state, ownProps) => {
      const endProps = {}

      fns.forEach(mapStateToProps => {
        Object.assign(endProps, mapStateToProps(state, {
          ...ownProps,
          ...endProps,
        }))
      })

      return endProps
    },
  },

  onBeforeRoute: {
    isAsync: true,
    combine: fns => async (...args) => {
      const ret = {}

      for (const onBeforeRoute of fns) {
        Object.assign(ret, await onBeforeRoute(...args))
      }

      return ret
    },
  },

  loadData: {
    isAsync: true,
    combine: fns => async (props, log, finished) => {
      for (const loadData of fns) {
        let cont = false

        await loadData(props, log, () => { cont = true })

        if (!cont) return
      }

      finished()
    },
  },
}

// Turn the tree of groups defined in ./resources.js into one flat object that
// will be passed to org-shell
function resourcesFromGroups(groups) {
  const resources = {}

  Object.entries(groups).forEach(([ key, group ]) => {
    const groupKey = `ResourceGroup:${key}`
        , parents = getParents(group)

    group.name = key;
    group.parents = parents;

    // For each group, modify the name of the aggregated functions at the group
    // level to reflect that they are part of the group. (For easier debugging).
    Object.keys(aggregatedResourceAttributes).forEach(attr => {
      if (typeof group[attr] === 'function') {
        defineName(group[attr], `${groupKey}:${attr}`)
      }
    })

    // Now iterate through the resources defined in the group and construct an
    // org-shell resource for each
    Object.entries(group.resources).forEach(([ key, _resource ]) => {
      const resource = { ..._resource }
          , resourceKey = `Resource:${key}`


      resource.name = key;
      resource.hierarchy = parents.concat(group, resource)

      // For each of the aggregated functions defined above, aggregate the
      // fns from the topmost parent down to the resource itself. Combine those
      // aggregated functions via the `.combine()` method defined in the field
      // definitions above.
      Object.entries(aggregatedResourceAttributes).forEach(([ attr, spec ]) => {
        const { combine } = spec

        if (typeof resource[attr] === 'function') {
          defineName(resource[attr], `${resourceKey}:${attr}`)
        }

        resource[attr] = combine(resource.hierarchy
          .map(level => level[attr])
          .filter(x => x))

        defineName(resource[attr], `${resourceKey}:aggregated:${attr}`)
      })

      // Now wrap the resource's component in higher order components.
      const componentTransforms = [
        connect(resource.mapStateToProps),
        withLoadProgress(resource),
        withReduxState,
        ...resource.wrappers,
      ]

      resource.Component = componentTransforms.reduce(
        (Component, wrapper) => wrapper(Component),
        resource.Component)

      resource.Component.displayName = `Resource:${resource.name}`

      resource.makeTitle = () => `${group.label} | ${resource.label}`

      // ...and add it to the list of registered resources
      resources[key] = resource
    })
  })

  return resources
}


const resources = resourcesFromGroups(resourceGroups)

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
