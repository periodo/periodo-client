"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , { LayoutRenderer } = require('org-layouts')
    , { LocationStreamAware } = require('org-shell')
    , blocks = require('./blocks')

module.exports = LocationStreamAware((props) => {
  const [ hoveredPeriod, setHoveredPeriod ] = useState(null)
      , [ selectedPeriod, setSelectedPeriod ] = useState(null)

  const data = props.useAuthorities
    ? props.dataset.authorities
    : props.dataset.periods

  return (
    h(LayoutRenderer, R.omit([ 'dataset', 'backend', 'locationStream' ], {
      ...props,
      blocks,
      data,
      extraProps: {
        backend: props.backend,
        dataset: props.dataset,
        gazetteers: props.gazetteers,
        locationStream: props.locationStream,
        hoveredPeriod,
        setHoveredPeriod,
        selectedPeriod,
        setSelectedPeriod,
      },
    }))
  )
})
