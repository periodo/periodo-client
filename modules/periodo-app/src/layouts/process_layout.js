"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , parseLayout = require('./parser')

// Take an object full of definitions of blocks, and the specification of a
// layout, and return a normalized representation.
module.exports = function processLayout(blockDefs, layoutString) {
  const parsedLayout = parseLayout(layoutString)

  return R.pipe(
    R.over(
      R.lensProp('blocks'),
      R.map(({
        id,
        type,
        section,
        opts,
      }) => {
          const {
            Component=() => h('div', {
              style: {
                backgroundColor: 'red',
              },
            }, `No such block type: ${type}`),
            makeFilter=null,
            processOpts=R.defaultTo({}, R.identity),
            defaultOpts={},
            keepMounted=false,
          } = (blockDefs[type] || {})

          return {
            id,
            type,
            section,
            block: {
              Component,
              makeFilter,
              processOpts,
              keepMounted,
            },
            defaultOpts: {
              ...defaultOpts,
              ...opts,
            },
          }
      })
    )
  )(parsedLayout)
}
