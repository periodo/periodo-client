"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , through = require('through2')
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
                backgroundColor: 'red'
              },
            }, `No such block type: ${type}`),
            makeInputStream=through.obj,
            makeOutputStream=through.obj,
            processOpts=R.defaultTo({}, R.identity),
            defaultOpts={}
          } = (blockDefs[type] || {})

          return {
            id,
            type,
            gridRow,
            gridColumn,
            block: {
              Component,
              makeInputStream,
              makeOutputStream,
              processOpts,
            },
            defaultOpts: Object.assign({}, defaultOpts, opts),
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
