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

  R.forEach(groupSpec => {
    const layouts = []
        , filters = []

    R.forEach(layoutSpec => {
      const { props=emptyObj, opts=emptyObj, name } = layoutSpec
          , { handler } = _getLayout(name)
          , { deriveOpts=R.identity, filterItems } = handler
          , derivedOpts = deriveOpts(opts)

      if (filterItems) {
        filters.push(data => filterItems(data, derivedOpts))
      }

      layouts.push({
        name,
        handler,
        derivedOpts,
        props,
      })
    }, groupSpec.layouts || emptyArr)

    filtersByGroup.push(filters)

    groups.push({
      layouts,
      props: groupSpec.props || emptyObj,
    })
  }, spec.groups)

  return {
    groups,
    getStreams() {
      return filtersByGroup.reduce(
        (streams, filters) =>
          streams.concat(
            R.last(streams).pipe(makeFilterStream(filters))),
        [createReadStream()])
    }
  }
}
