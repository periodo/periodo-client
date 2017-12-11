"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , through = require('through2')
    , { Box } = require('axs-ui')
    , parseLayout = require('./parser')

// Take an object full of definitions of blocks, and the specification of a
// layout, and return a normalized representation.
module.exports = function processLayout(blockDefs, layoutString) {
  const parsedLayout = parseLayout(layoutString)
  return R.pipe(
      R.over(
        R.lensProp('blocks'),
        R.map(({ id, name, opts, gridRow='auto', gridColumn='auto' }) => {
          const {
            Component=() => h(Box, { bg: 'red4' }, `No such layout: ${name}`),
            makeInputStream=through.obj,
            makeOutputStream=through.obj,
            processOpts=R.defaultTo({}, R.identity),
            defaultOpts={}
          } = (blockDefs[name] || {})

          return {
            id,
            name,
            opts,
            gridRow,
            gridColumn,
            block: {
              Component,
              makeInputStream,
              makeOutputStream,
              processOpts,
            },
            baseOpts: Object.assign({}, defaultOpts, opts),
            defaultOpts,
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
