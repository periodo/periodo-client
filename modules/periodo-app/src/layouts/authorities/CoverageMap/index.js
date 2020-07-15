"use strict";

const h = require('react-hyperscript')
    , { HelpText, InlineText, LabeledMap } = require('periodo-ui')

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
  selectedPeriod,
  selectedPeriodIsVisible,
  gazetteers,
}) => {

  return (h('div'), [
    h(HelpText, { key: 'help' }, [
      'Places covered by the listed periods',
      ...(selectedPeriod
        ? [
          ', with the selected period in ',
          h(InlineText, { color: '#ff0000' }, 'red'),
        ]
        : []
      ),
      '. Use mouse or touch to pan',
    ]),

    h(LabeledMap, {
      key: 'map',
      focusedFeatures: selectedPeriodIsVisible
        ? featuresOf(selectedPeriod, gazetteers)
        : [],
      features: allFeatures(periods, gazetteers),
    }),
  ])
}

module.exports = {
  label: 'Spatial coverage map',
  description: 'WebGL map showing spatial coverage of selected periods',
  Component: CoverageMap,
}
