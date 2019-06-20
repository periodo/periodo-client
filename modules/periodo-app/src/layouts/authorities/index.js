"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutRenderer } = require('org-layouts')
    , blocks = require('./blocks')

module.exports = function PeriodoLayoutRenderer(props) {
  return (
    h(LayoutRenderer, R.omit(['dataset', 'backend'], Object.assign({}, props, {
      blocks,
      data: props.dataset.periods,
      extraProps: { backend: props.backend, dataset: props.dataset },
    })))
  )
}
