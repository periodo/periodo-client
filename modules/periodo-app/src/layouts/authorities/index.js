"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , { LayoutRenderer } = require('org-layouts')
    , { Navigable } = require('org-shell')
    , blocks = require('./blocks')

module.exports = Navigable((props) => {
  const [ hoveredPeriod, setHoveredPeriod ] = useState(null)
      , [ selectedPeriod, setSelectedPeriod ] = useState(null)

  const data = props.useAuthorities
    ? props.dataset.authorities
    : props.dataset.periods

  return (
    h(LayoutRenderer, R.omit([ 'dataset', 'backend', 'navigateTo' ], {
      ...props,
      blocks,
      data,
      extraProps: {
        backend: props.backend,
        dataset: props.dataset,
        gazetteers: props.gazetteers,
        navigateTo: props.navigateTo,
        hoveredPeriod,
        setHoveredPeriod,
        selectedPeriod,
        setSelectedPeriod,
      },
    }))
  )
})
