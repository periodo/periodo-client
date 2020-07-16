"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , LayoutRenderer = require('../LayoutRenderer')
    , { Navigable } = require('org-shell')
    , blocks = require('./blocks')

module.exports = Navigable(({
  data,
  fixedPeriod,

  shellOpts,
  updateShellOpts,

  dataset,
  backend,
  navigateTo,
  defaultYearRangeStart,
  gazetteers,
  ...props
}) => {
  let selectedPeriod = null

  if (fixedPeriod) {
    selectedPeriod = fixedPeriod
  } else if (shellOpts.selectedPeriod) {
    selectedPeriod = dataset.periodByID(shellOpts.selectedPeriod)
  }

  const [ hoveredPeriod, setHoveredPeriod ] = useState(null)
      , [ isHovering, setIsHovering ] = useState(false)

  const setSelectedPeriod = period => {
    updateShellOpts(
      period
        ? R.assoc('selectedPeriod', period.id)
        : R.dissoc('selectedPeriod'),
      true)
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

        isHovering,
        setIsHovering,

        hoveredPeriod,
        setHoveredPeriod,

        selectedPeriod,
        setSelectedPeriod,
      },
    })
  )
})
