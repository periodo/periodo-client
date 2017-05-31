"use strict";

const R = require('ramda')
    , through = require('through2')
    , emptyObj = Object.freeze({})
    , emptyArr = Object.freeze([])

// We'll get three things:
//
//   1. The layout streams at each level, plus the one leftover stream that
//      will be the result of all the filtering from all the blocks
//
//   2. The props for each of the groups
//
//   3. The props for each of the layouts, including each of their individual
//      streams
//
//  (2) does not include the streams from (1). Groups are "dumb" containers:
//  they do not have any awareness of the data that passes through them. They
//  only know about props passed to them (i.e. `className`, `style`, or any
//  style properties defined in the cxs library.

function getLayout(registeredLayouts, name) {
  const layout = registeredLayouts[name]

  if (!layout) {
    throw new Error(`No registered layout with name ${name}`)
  }

  return layout
}

function makeFilterStream(filters) {
  return through.obj(function (data, enc, cb) {
    if (!filters.length || filters.some(fn => fn(data))) {
      this.push(data)
    }

    cb();
  })
}


module.exports = function parseEngineSpec(registeredLayouts, createReadStream, spec) {
  const _getLayout = R.memoize(R.curry(getLayout)(registeredLayouts))
      , groups = []
      , filtersByGroup = []

  spec.groups.forEach((groupSpec, i) => {
    const layouts = []

    filtersByGroup[i] = []

    ;(groupSpec.layouts || emptyArr).forEach((layoutSpec, j) => {
      const layout = _getLayout(layoutSpec.name)
          , { props=emptyObj, opts=emptyObj, } = layoutSpec
          , { deriveOpts=R.identity, handler } = layout
          , derivedOpts = deriveOpts(opts)

      if (layout.filterItems) {
        filtersByGroup[i].push(data => layout.filterItems(data, derivedOpts))
      }

      layouts[j] = {
        handler,
        derivedOpts,
        props,
      }
    })

    groups[i] = {
      layouts,
      props: groupSpec.props || emptyObj,
    }
  })

  return {
    groups,
    streams: filtersByGroup.reduce(
      (streams, filters) =>
        streams.concat(
          R.last(streams).pipe(makeFilterStream(filters))),
      [createReadStream()]
    )
  }
}
