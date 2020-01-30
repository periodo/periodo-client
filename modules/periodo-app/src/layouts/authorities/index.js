"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , { LayoutRenderer } = require('org-layouts')
    , { Navigable } = require('org-shell')
    , blocks = require('./blocks')

module.exports = Navigable(({ fixedPeriod, ...props }) => {

  const [ hoveredPeriod, setHoveredPeriod ] = fixedPeriod
    ? [ null, () => {} ]
    : useState(props.hoveredPeriod)

  const [ selectedPeriod, setSelectedPeriod ] = fixedPeriod
    ? [ fixedPeriod, () => {} ]
    : useState(props.selectedPeriod)

  let data = props.useAuthorities
    ? props.dataset.authorities
    : props.dataset.periods

  if (props.filter) {
    data = data.filter(props.filter)
  }

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
        fixedPeriod,
      },
    }))
  )
})
