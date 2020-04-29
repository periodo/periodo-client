"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , { updateLayoutParams, period: { authorityOf }} = require('periodo-utils')
    , LayoutRenderer = require('../LayoutRenderer')
    , { Navigable } = require('org-shell')
    , blocks = require('./blocks')

const noop = () => {}

module.exports = Navigable(({ fixedPeriod, ...props }) => {

  const [ hoveredPeriod, setHoveredPeriod ] = fixedPeriod
    ? [ null, noop ]
    : useState(null)

  const [ selectedPeriod, _setSelectedPeriod ] = fixedPeriod
    ? [ fixedPeriod, noop ]
    : useState(props.selectedPeriod)

  const [ selectedPeriodIsVisible, setSelectedPeriodIsVisible ] = fixedPeriod
    ? [ true, noop ]
    : useState(!!props.selectedPeriod)

  const setSelectedPeriod = period => {
    _setSelectedPeriod(period)
    setSelectedPeriodIsVisible(!!period)
    updateLayoutParams({
      periodID: period ? period.id : null,
      authorityID: period ? authorityOf(period).id : null,
    })
  }

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
        selectedPeriodIsVisible,
        setSelectedPeriodIsVisible,
      },
    }))
  )
})
