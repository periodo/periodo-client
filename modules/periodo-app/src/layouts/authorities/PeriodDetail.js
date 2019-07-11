"use strict";

const h = require('react-hyperscript')
    , { Period } = require('periodo-ui')

function PeriodDetail({ hoveredPeriod, selectedPeriod, gazetteers }) {
  const period = hoveredPeriod || selectedPeriod || null

  return h('div', {
    style: {
      minHeight: 420,
    },
  }, [
    period == null ? null : (
      h(Period, { value: period, gazetteers })
    )
  ])
}

module.exports = {
  label: 'Period detail',
  description: 'Details of a hovered or focused period',
  Component: PeriodDetail,
}
