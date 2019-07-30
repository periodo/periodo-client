"use strict";

const h = require('react-hyperscript')
    , { Authority } = require('periodo-ui')
    , { period: { authorityOf }} = require('periodo-utils')

function AuthorityDetail({ hoveredPeriod, selectedPeriod }) {
  const period = hoveredPeriod || selectedPeriod || null

  return h('div', {
    style: {
      minHeight: 420,
    },
  }, [
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
