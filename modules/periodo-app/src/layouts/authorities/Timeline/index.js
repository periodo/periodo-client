"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , AutoSizer = require('react-virtualized-auto-sizer')
    , { HelpText, InlineText } = require('periodo-ui')
    , Plot = require('./Plot')

class Timeline extends React.Component {
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.data !== this.props.data ||
      nextProps.selectedPeriod !== this.props.selectedPeriod ||
      nextProps.opts.visualization !== this.props.opts.visualization
    )
  }

  render() {
    const {
      updateOpts,
      dataset,
      data,
      selectedPeriod,
      opts: { visualization, height },
    } = this.props

    const showSelectedPeriod = !!selectedPeriod && data.includes(selectedPeriod)

    return (
      h('div', [
        h(HelpText, { key: 'help' }, [
          'Temporal extents covered by the listed periods',
          ...(showSelectedPeriod
            ? [
              ', with the selected period in ',
              h(InlineText, { color: '#ff0000' }, 'red'),
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
            selectedPeriod: showSelectedPeriod ? selectedPeriod : null,
          }),
        ]),
      ])
    )
  }
}

module.exports = {
  label: 'Temporal coverage visualization',
  description: 'd3 timeline showing temporal coverage of selected periods',
  Component: Timeline,
}
