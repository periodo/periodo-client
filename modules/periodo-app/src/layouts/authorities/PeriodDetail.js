"use strict";

const h = require('react-hyperscript')
    , { Period, Heading, Box, Link, LinkIcon } = require('periodo-ui')
    , { Route } = require('org-shell')
    , { period: { authorityOf }} = require('periodo-utils')

function PeriodDetail({
  hoveredPeriod,
  selectedPeriod,
  gazetteers,
  backend,
}) {
  const period = hoveredPeriod || selectedPeriod || null

  return h(Box, {
    pl: 2,
    style: {
      minHeight: 600,
      wordBreak: 'break-word',
    },
  }, period == null ? null : [
    h(Heading, {
      level: 4,
      style: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #ddd',
        paddingBottom: '4px',
      },
    }, [
      h(Link, {
        mr: 2,
        style: {
          display: 'flex',
        },
        route: new Route('period-view', {
          backendID: backend.asIdentifier(),
          authorityID: authorityOf(period).id,
          periodID: period.id,
        }),
      }, [
        h(LinkIcon, {
          stroke: '#4dabf7',
          strokeWidth: 3,
          title: 'View period page',
        }),
      ]),

      'Period',
    ]),

    h(Period, {
      value: period,
      gazetteers,
    }),
  ])
}

module.exports = {
  label: 'Period detail',
  description: 'Details of a hovered or focused period',
  Component: PeriodDetail,
}
