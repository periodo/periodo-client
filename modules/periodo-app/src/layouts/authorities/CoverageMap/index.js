"use strict";

const h = require('react-hyperscript')
    , React = require('react')
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

class CoverageMap extends React.Component {
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.data !== this.props.data ||
      nextProps.selectedPeriod !== this.props.selectedPeriod ||
      nextProps.gazetteers !== this.props.gazetteers
    )
  }

  render() {
    const {
      data: periods,
      selectedPeriod,
      gazetteers,
    } = this.props

    const showSelectedPeriod = !!selectedPeriod && periods.includes(selectedPeriod)

    return (
      h('div', [
        h(HelpText, { key: 'help' }, [
          'Places covered by the listed periods',
          ...(showSelectedPeriod
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
          focusedFeatures: showSelectedPeriod
            ? featuresOf(selectedPeriod, gazetteers)
            : [],
          features: allFeatures(periods, gazetteers),
        }),
      ])
    )
  }
}

module.exports = {
  label: 'Spatial coverage map',
  description: 'WebGL map showing spatial coverage of selected periods',
  Component: CoverageMap,
}
