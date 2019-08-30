"use strict";

const h = require('react-hyperscript')
    , { Authority, LinkIcon, Box, Heading, Link } = require('periodo-ui')
    , { Route } = require('org-shell')
    , { period: { authorityOf }} = require('periodo-utils')

function AuthorityDetail({
  hoveredPeriod,
  selectedPeriod,
  backend,
}) {
  const period = hoveredPeriod || selectedPeriod || null
      , authority = period && authorityOf(period)

  return h(Box, {
    pl: 2,
    style: {
      minHeight: 600,
      wordBreak: 'break-word',
    },
  }, authority == null ? null : [
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
        route: new Route('authority-view', {
          backendID: backend.asIdentifier(),
          authorityID: authority.id,
        }),
      }, [
        h(LinkIcon, {
          stroke: '#4dabf7',
          strokeWidth: 3,
          title: 'View authority page',
        }),
      ]),

      'Authority',
    ]),

    h(Authority, { value: authority }),
  ])
}

module.exports = {
  label: 'Authority detail',
  description: 'Details of a hovered or focused period',
  Component: AuthorityDetail,
}
