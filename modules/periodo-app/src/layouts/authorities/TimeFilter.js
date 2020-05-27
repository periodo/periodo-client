"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Label, HelpText, TimeSlider } = require('periodo-ui')
    , { terminus: { earliestYear }} = require('periodo-utils')

class TimeFilter extends React.Component {

  constructor (props) {
    super(props)

    const defaultYearRange = TimeSlider.getDefaultYearRange()
        , { defaultYearRangeStart=null } = props

    this.defaultYearRange = (
      defaultYearRangeStart === null
        ? defaultYearRange
        : [ defaultYearRangeStart, defaultYearRange[1] ]
    )
  }

  componentDidMount () {
    this.props.setBlockState({ defaultYearRange: this.defaultYearRange })
  }

  render () {

    const { opts, updateOpts } = this.props
        , yearRange = opts.yearRange || this.defaultYearRange

    return (
      h(Box, [
        h(Label, 'By time'),

        h(HelpText, 'Show periods that start within the selected range'),

        h(TimeSlider, {
          yearRange,
          onChange: yearRange => {
            updateOpts({
              ...opts,
              yearRange,
            }, true)
          },
        }),
      ])
    )
  }
}

module.exports = {
  label: 'Time filter',
  description: 'Filter periods by specifying a temporal range',
  makeFilter(opts, state) {

    const yearRange = opts.yearRange || state.defaultYearRange || null

    if (! yearRange) return null

    return period => {
      if (period.start == undefined) return false
      const earliestStart = earliestYear(period.start)
      return (
        earliestStart != null &&
        earliestStart >= yearRange[0] &&
        earliestStart <= yearRange[1]
      )
    }
  },
  Component: TimeFilter,
}
