"use strict";

const h = require('react-hyperscript')
    , { WorldMap } = require('periodo-ui')

const CoverageMap = ({ data: periods, gazetteers }) => {
  const featureSet = periods.reduce(
    (featureSet, period) => {
      (period.spatialCoverage || [])
        .map(({ id }) => gazetteers.find(id))
        .filter(feature => feature !== null)
        .forEach(feature => featureSet.add(feature))
      return featureSet
    },
    new Set()
  )
  return h(WorldMap, {
    height: 256,
    border: '1px solid #ccc',
    features: [ ...featureSet ],
  })
}

module.exports = {
  label: 'Spatial coverage map',
  description: 'WebGL map showing spatial coverage of selected periods',
  Component: CoverageMap,
}
