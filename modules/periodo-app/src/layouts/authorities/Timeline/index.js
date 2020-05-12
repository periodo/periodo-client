"use strict";

const h = require('react-hyperscript')
    , AutoSizer = require('react-virtualized-auto-sizer')
    , { Label, HelpText, Span } = require('periodo-ui')
    , Plot = require('./Plot')

function Timeline({
  updateOpts,
  dataset,
  data,
  selectedPeriod,
  selectedPeriodIsVisible,
  opts: { visualization, height },
}) {

  return (h('div'), [
    h(Label, { key: 'label' }, 'Temporal coverage'),

    h(HelpText, { key: 'help' }, [
      'Temporal extents covered by the listed periods',
      ...(selectedPeriod
        ? [
          ', with the selected period in ',
          h(Span, { color: '#ff0000' }, 'red'),
        ]
        : []
      ),
    ]),

    h(AutoSizer, {
      key: 'timeline',
      style: { height: 234 },
    }, [
      ({ width }) => h(Plot, {
        width,
        height,
        updateOpts,
        visualization,
        dataset,
        data,
        selectedPeriod: selectedPeriodIsVisible ? selectedPeriod : null,
      }),
    ]),
  ])
}

module.exports = {
  label: 'Temporal coverage visualization',
  description: 'd3 timeline showing temporal coverage of selected periods',
  Component: Timeline,
}
