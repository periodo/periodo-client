"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutEngine } = require('org-layouts')
    , fromArray = require('from2-array')
    , blocks = require('./blocks')

const PeriodoLayoutEngine = ({
  addAt,
  backend,
  dataset,
  editGrid,
  layout,
  blockOpts,
  onBlockOptsChange,
}) =>
  h(LayoutEngine, {
    blocks,
    createReadStream: () =>
      fromArray.obj(
        R.pipe(
          R.values,
          R.map(authority => ({
            authority,
            definitions: authority.definitions,
          }))
        )(dataset.periodCollections)
      ),
    layout,
    blockOpts,
    onBlockOptsChange,

    addAt,
    editGrid,
    extraProps: { backend },
  })

module.exports = PeriodoLayoutEngine;
