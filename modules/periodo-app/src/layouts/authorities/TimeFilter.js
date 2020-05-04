"use strict";

const h = require('react-hyperscript')
    , { Box, Label, HelpText, TimeSlider } = require('periodo-ui')
    , { terminus: { earliestYear }} = require('periodo-utils')

const TimeFilter = ({
  opts,
  updateOpts,
}) => {
  return (
    h(Box, [
      h(Label, 'By time'),

      h(HelpText, 'Show periods that start within the selected range'),

      h(TimeSlider, {
        yearRange: opts.yearRange,
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

module.exports = {
  label: 'Time filter',
  description: 'Filter periods by specifying a temporal range',
  makeFilter({ yearRange }) {

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
  processOpts: opts => ({
    yearRange: TimeSlider.getDefaultYearRange(),
    ...opts,
  }),
  Component: TimeFilter,
}
