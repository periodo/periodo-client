"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('periodo-ui')
    , AuthorityDetail = require('./AuthorityDetail').Component
    , PeriodDetail = require('./PeriodDetail').Component

function AuthorityPeriodDetail({
  hoveredPeriod,
  selectedPeriod,
  backend,
}) {
  if (! (hoveredPeriod || selectedPeriod)) {
    return h(Box, { mt: -3 })
  }
  return h(Flex, {
  }, [
    h(AuthorityDetail, {
      flex: 0.5,
      mr: 3,
      hoveredPeriod,
      selectedPeriod,
      backend,
    }),
    h(PeriodDetail, {
      flex: 0.5,
      hoveredPeriod,
      selectedPeriod,
      backend,
    }),
  ])
}

module.exports = {
  label: 'Authority and period details',
  description: 'Details of a hovered or focused period',
  Component: AuthorityPeriodDetail,
}
