"use strict";

const { connect } = require('react-redux')
    , { withLoadProgress, withReduxState, withMenu, withBreadcrumb } = require('./wrappers')
    , resourceGroups = require('./resources')


function defineFunctionName(fn, value) {
  Object.defineProperty(fn, 'name', { value })
}

function groupHierarchy(group) {
  return group.parent
    ? [ ...groupHierarchy(group.parent), group ]
    : [ group ]
}


// These are attributes that will be aggregated between resource groups and
// individual resources, as defined in ./resources.js
const aggregatedResourceAttributes = {
  wrappers: {
    combine: args => args.flat(),
  },

  mapStateToProps: {
    combine(fns) {
      return (state, ownProps) => {
        const endProps = {}

        fns.forEach(mapStateToProps => {
          Object.assign(endProps, mapStateToProps(state, {
            ...ownProps,
            ...endProps,
          }))
        })

        return endProps
      }
    },
  },

  onBeforeRoute: {
    isAsync: true,
    combine(fns) {
      return async (...args) => {
        const ret = {}

        for (const onBeforeRoute of fns) {
          Object.assign(ret, await onBeforeRoute(...args))
        }

        return ret
      }
    },
  },

  loadData: {
    isAsync: true,
    combine(fns) {
      return async (props, log, finished) => {
        for (const loadData of fns) {
          let cont = false

          await loadData(props, log, () => { cont = true })

          if (!cont) return
        }

        finished()
      }
    },
  },
}

// Turn the tree of groups defined in ./resources.js into one flat object that
// will be passed to org-shell
function resourcesFromGroups(groups) {
  const resources = {}

  Object.entries(groups).forEach(([ key, group ]) => {
    const groupKey = `ResourceGroup:${key}`
        , parents = groupHierarchy(group)

    group.name = key;
    group.parents = parents;

    // For each group, modify the name of the aggregated functions at the group
    // level to reflect that they are part of the group. (For easier debugging).
    Object.keys(aggregatedResourceAttributes).forEach(attr => {
      if (typeof group[attr] === 'function') {
        defineFunctionName(group[attr], `${groupKey}:${attr}`)
      }
    })

    // Now iterate through the resources defined in the group and construct an
    // org-shell resource for each
    Object.entries(group.resources).forEach(([ key, _resource ]) => {
      const resource = { ..._resource }
          , resourceKey = `Resource:${key}`

      resource.name = key;
      resource.hierarchy = [ ...parents, resource ]

      // For each of the aggregated functions defined above, aggregate the
      // fns from the topmost parent down to the resource itself. Combine those
      // aggregated functions via the `.combine()` method defined in the field
      // definitions above.
      Object.entries(aggregatedResourceAttributes).forEach(([ attr, spec ]) => {
        const { combine } = spec

        if (typeof resource[attr] === 'function') {
          defineFunctionName(resource[attr], `${resourceKey}:${attr}`)
        }

        resource[attr] = combine(resource.hierarchy
          .map(level => level[attr])
          .filter(x => x))

        if (typeof resource[attr] === 'function') {
          defineFunctionName(resource[attr], `${resourceKey}:aggregated:${attr}`)
        }
      })

      // Now wrap the resource's component in higher order components.
      const componentTransforms = [
        withBreadcrumb(resource),
        connect(resource.mapStateToProps),
        withLoadProgress(resource),
        withReduxState,
        withMenu(resource),
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

module.exports = resourcesFromGroups(resourceGroups)
