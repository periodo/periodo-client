"use strict";

const h = require('react-hyperscript')
    , { Authority, Label, Box } = require('periodo-ui')
    , { period: { authorityOf }} = require('periodo-utils')

function AuthorityDetail({ hoveredPeriod, selectedPeriod }) {
  const period = hoveredPeriod || selectedPeriod || null

  return h(Box, {
    pl: 2,
    style: {
      minHeight: 420,
    },
  }, [
    period == null ? null : h(Label, {}, 'Authority'),
    period == null ? null : (
      h(Authority, { value: authorityOf(period) })
    ),
  ])
}

module.exports = {
  label: 'Authority detail',
  description: 'Details of a hovered or focused period',
  Component: AuthorityDetail,
}
