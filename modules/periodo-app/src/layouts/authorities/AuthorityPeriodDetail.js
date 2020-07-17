"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('periodo-ui')
    , AuthorityDetail = require('./AuthorityDetail').Component
    , PeriodDetail = require('./PeriodDetail').Component

function AuthorityPeriodDetail({
  isHovering,
  hoveredPeriod,
  selectedPeriod,
  backend,
  data,
}) {
  let showPeriod = null

  if (isHovering && hoveredPeriod) {
    showPeriod = hoveredPeriod
  } else if (selectedPeriod && data.includes(selectedPeriod)) {
    showPeriod = selectedPeriod
  } else if (hoveredPeriod) {
    showPeriod = hoveredPeriod
  }

  if (!showPeriod) {
    return h(Box, { mt: -3 })
  }

  return (
    h(Flex, [
      h(AuthorityDetail, {
        flex: 0.5,
        mr: 3,
        period: showPeriod,
        backend,
      }),
      h(PeriodDetail, {
        flex: 0.5,
        period: showPeriod,
        backend,
      }),
    ])
  )
}

module.exports = {
  label: 'Authority and period details',
  description: 'Details of a hovered or focused period',
  Component: AuthorityPeriodDetail,
}
