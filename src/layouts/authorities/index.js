"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LayoutEngine = require('lib/layout-engine/Engine')
    , fromArray = require('from2-array')

const PeriodoLayoutEngine = ({
  addAt,
  backend,
  dataset,
  editGrid,
  spec=[],
  onSpecChange,
}) => {
  return (
    h(LayoutEngine, {
      layouts: {
        statistics: require('./Statistics'),
        list: require('./PeriodList'),
        text: require('./TextSearch'),
        authorityList: require('./AuthorityList'),
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
  )
}

module.exports = PeriodoLayoutEngine;
