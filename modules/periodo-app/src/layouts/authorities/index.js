"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , { LayoutRenderer } = require('org-layouts')
    , blocks = require('./blocks')

module.exports = function PeriodoLayoutRenderer(props) {
  const [ hoveredPeriod, setHoveredPeriod ] = useState(null)
      , [ selectedPeriod, setSelectedPeriod ] = useState(null)

  const data = props.useAuthorities
    ? props.dataset.authorities
    : props.dataset.periods

  return (
    h(LayoutRenderer, R.omit(['dataset', 'backend'], Object.assign({}, props, {
      blocks,
      data,
      extraProps: {
        backend: props.backend,
        dataset: props.dataset,
        hoveredPeriod,
        setHoveredPeriod,
        selectedPeriod,
        setSelectedPeriod,
      },
    })))
  )
}
