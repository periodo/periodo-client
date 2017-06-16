"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LayoutEngine = require('../layout-engine/Engine')
    , fromArray = require('from2-array')

const PeriodoLayoutEngine = props =>
  h(LayoutEngine, {
    createReadStream: () => fromArray.obj(
      R.values(props.backend.dataset.periodCollections)
    ),
    layouts: {
      statistics: require('../layouts/Statistics'),
      list: require('../layouts/PeriodList'),
      authorityList: require('../layouts/AuthorityList'),
      text: require('../layouts/TextSearch'),
    },
    spec: props.spec,
    updateLayoutOpts: props.updateLayoutOpts,
    extra: {
      backend: props.backend,
    }
  })

module.exports = PeriodoLayoutEngine;
