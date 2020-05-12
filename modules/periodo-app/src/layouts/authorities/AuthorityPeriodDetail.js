"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('periodo-ui')
    , AuthorityDetail = require('./AuthorityDetail').Component
    , PeriodDetail = require('./PeriodDetail').Component

function AuthorityPeriodDetail({
  hoveredPeriod,
  selectedPeriod,
  selectedPeriodIsVisible,
  backend,
}) {
  if (! (hoveredPeriod || (selectedPeriod && selectedPeriodIsVisible))) {
    return h(Box, { mt: -3 })
  }
  const period = hoveredPeriod || selectedPeriod
  return h(Flex, {
  }, [
    h(AuthorityDetail, {
      flex: 0.5,
      mr: 3,
      period,
      backend,
    }),
    h(PeriodDetail, {
      flex: 0.5,
      period,
      backend,
    }),
  ])
}

module.exports = {
  label: 'Authority and period details',
  description: 'Details of a hovered or focused period',
  Component: AuthorityPeriodDetail,
}
