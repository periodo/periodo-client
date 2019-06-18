"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutRenderer } = require('org-layouts')
    , fromArray = require('from2-array')
    , blocks = require('./blocks')

module.exports = function PeriodoLayoutRenderer(props) {
  return (
    h(LayoutRenderer, R.omit(['dataset', 'backend'], Object.assign({}, props, {
      blocks,
      createReadStream: () => fromArray.obj(
        props.dataset.authorities.map(authority => ({
          authority,
          periods: authority.periods,
        }))),
      extraProps: { backend: props.backend, dataset: props.dataset },
    })))
  )
}
