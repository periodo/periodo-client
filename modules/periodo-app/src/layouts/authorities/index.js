"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutEngine } = require('org-layouts')
    , fromArray = require('from2-array')

const PeriodoLayoutEngine = ({
  addAt,
  backend,
  dataset,
  editGrid,
  spec=[],
  onSpecChange,
}) =>
  h(LayoutEngine, {
    blocks: {
      statistics: require('./Statistics'),
      list: require('./PeriodList'),
      text: require('./TextSearch'),
      authorityList: require('./AuthorityList'),
      test: require('./d3_test'),
    },

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
    spec,
    onSpecChange,

    addAt,
    editGrid,
    extraProps: { backend },
  })

module.exports = PeriodoLayoutEngine;
