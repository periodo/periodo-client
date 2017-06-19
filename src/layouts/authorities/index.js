"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LayoutEngine = require('lib/layout-engine/Engine')
    , fromArray = require('from2-array')

const PeriodoLayoutEngine = props =>
  h(LayoutEngine, {
    createReadStream: () => fromArray.obj(
      R.values(props.backend.dataset.periodCollections)
    ),
    layouts: {
      statistics: require('./Statistics'),
      list: require('./PeriodList'),
      authorityList: require('./AuthorityList'),
      text: require('./TextSearch'),
    },
    spec: props.spec,
    updateLayoutOpts: props.updateLayoutOpts,
    extra: {
      backend: props.backend,
    }
  })

module.exports = PeriodoLayoutEngine;
