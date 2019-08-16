"use strict";

const h = require('react-hyperscript')
    , { LabeledMap } = require('periodo-ui')

const featuresOf = (period, gazetteers) => {
  if (!period) return []
  return (period.spatialCoverage || [])
    .map(({ id }) => gazetteers.find(id))
    .filter(feature => feature && feature.id)
}

const allFeatures = (periods, gazetteers) => Object.values(
  periods.reduce(
    (featuresById, period) => {
      featuresOf(period, gazetteers)
        .forEach(feature => featuresById[feature.id] = feature)
      return featuresById
    },
    {}
  )
)

const CoverageMap = ({
  data: periods,
  hoveredPeriod,
  selectedPeriod,
  gazetteers,
}) => {

  const focusedPeriod = hoveredPeriod || selectedPeriod || null

  return h(LabeledMap, {
    focusedFeatures: featuresOf(focusedPeriod, gazetteers),
    features: allFeatures(periods, gazetteers),
    height: 250,
  })
}

module.exports = {
  label: 'Spatial coverage map',
  description: 'WebGL map showing spatial coverage of selected periods',
  Component: CoverageMap,
}
