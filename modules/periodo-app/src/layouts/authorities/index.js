"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { updateLayoutParams } = require('periodo-utils')
    , LayoutRenderer = require('../LayoutRenderer')
    , { Navigable } = require('org-shell')
    , blocks = require('./blocks')

const noop = () => {}

module.exports = Navigable(({
  data,
  fixedPeriod,
  selectedPeriod: selectedPeriodFromProps,
  dataset,
  backend,
  navigateTo,
  defaultYearRangeStart,
  gazetteers,
  ...props
}) => {

  const [ hoveredPeriod, setHoveredPeriod ] = fixedPeriod
    ? [ null, noop ]
    : useState(null)

  const [ selectedPeriod, _setSelectedPeriod ] = fixedPeriod
    ? [ fixedPeriod, noop ]
    : useState(selectedPeriodFromProps)

  const [ selectedPeriodIsVisible, setSelectedPeriodIsVisible ] = fixedPeriod
    ? [ true, noop ]
    : useState(!!selectedPeriodFromProps)

  const setSelectedPeriod = period => {
    _setSelectedPeriod(period)
    setSelectedPeriodIsVisible(!!period)
    updateLayoutParams({ periodID: period ? period.id : null })
  }

  return (
    h(LayoutRenderer, {
      ...props,
      blocks,
      data,
      extraProps: {
        backend,
        dataset,
        totalCount: data ? data.length : 0,
        defaultYearRangeStart,
        gazetteers,
        navigateTo,
        hoveredPeriod,
        setHoveredPeriod,
        selectedPeriod,
        setSelectedPeriod,
        selectedPeriodIsVisible,
        setSelectedPeriodIsVisible,
      },
    })
  )
})
