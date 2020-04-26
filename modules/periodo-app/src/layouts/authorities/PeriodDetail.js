"use strict";

const h = require('react-hyperscript')
    , { Period, Heading, Box, Link } = require('periodo-ui')
    , { Route } = require('org-shell')
    , { period: { authorityOf }} = require('periodo-utils')

function PeriodDetail({
  hoveredPeriod,
  selectedPeriod,
  gazetteers,
  backend,
  ...props
}) {
  const period = hoveredPeriod || selectedPeriod || null
      , authority = period && authorityOf(period)
      , editable = backend.asIdentifier().startsWith('local-')

  return h(Box, {
    style: {
      minHeight: 600,
      wordBreak: 'break-word',
    },
    ...props,
  }, period == null ? null : [
    h(Heading, {
      level: 4,
      fontSize: 2,
      style: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #ddd',
        paddingBottom: '4px',
      },
    }, [
      'Period',

      h(Link, {
        ml: 2,
        fontSize: 1,
        fontWeight: 100,
        style: {
          display: 'flex',
        },
        route: new Route('period-view', {
          backendID: backend.asIdentifier(),
          authorityID: authority.id,
          periodID: period.id,
        }),
      }, [
        'view',
      ]),

      editable ? h(Link, {
        ml: 2,
        fontSize: 1,
        fontWeight: 100,
        route: new Route('period-edit', {
          backendID: backend.asIdentifier(),
          authorityID: authority.id,
          periodID: period.id,
        }),
      }, [
        'edit',
      ]) : null,

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
