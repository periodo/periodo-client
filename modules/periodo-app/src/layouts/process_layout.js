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
      R.map(({ id, type, opts, gridRow='auto', gridColumn='auto' }) => {
          const {
            Component=() => h('div', {
              style: {
                backgroundColor: 'red',
              },
            }, `No such block type: ${type}`),
            makeFilter=null,
            processOpts=R.defaultTo({}, R.identity),
            defaultOpts={},
          } = (blockDefs[type] || {})

          return {
            id,
            type,
            gridRow,
            gridColumn,
            block: {
              Component,
              makeFilter,
              processOpts,
            },
            defaultOpts: {
              ...defaultOpts,
              ...opts,
            },
          }
      })
    ),
    R.over(
      R.lensProp('gridGap'),
      R.defaultTo('')
    ),

    R.over(
      R.lensProp('gridTemplateColumns'),
      R.defaultTo('')
    ),

    R.over(
      R.lensProp('gridTemplateRows'),
      R.defaultTo('')
    ),
  )(parsedLayout)
}
