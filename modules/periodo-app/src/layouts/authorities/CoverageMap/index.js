"use strict";

const h = require('react-hyperscript')
    , { Label, HelpText, Span, LabeledMap } = require('periodo-ui')

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
  opts,
  data: periods,
  selectedPeriod,
  selectedPeriodIsVisible,
  gazetteers,
}) => {

  return (h('div'), [
    h(Label, { key: 'label' }, 'Spatial coverage'),

    h(HelpText, { key: 'help' }, [
      'Places covered by the listed periods',
      ...(selectedPeriod
        ? [
          ', with the selected period in ',
          h(Span, { color: '#ff0000' }, 'red'),
        ]
        : []
      ),
      '. Use mouse or touch to pan',
    ]),

    h(LabeledMap, {
      key: 'map',
      height: opts.height ? parseInt(opts.height) : undefined,
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
