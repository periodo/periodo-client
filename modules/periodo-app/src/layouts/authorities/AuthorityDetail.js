"use strict";

const h = require('react-hyperscript')
    , { Authority, Box, Heading, Link } = require('periodo-ui')
    , { Route } = require('org-shell')
    , { period: { authorityOf }} = require('periodo-utils')

function AuthorityDetail({
  period,
  backend,
  ...props
}) {
  const authority = period && authorityOf(period)
      , editable = backend.asIdentifier().startsWith('local-')

  return h(Box, {
    style: {
      minHeight: 600,
      wordBreak: 'break-word',
    },
    ...props,
  }, authority == null ? null : [
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
      'Authority',

      h(Link, {
        ml: 2,
        fontSize: 1,
        fontWeight: 100,
        route: new Route('authority-view', {
          backendID: backend.asIdentifier(),
          authorityID: authority.id,
        }),
      }, [
        'view',
      ]),

      editable ? h(Link, {
        ml: 2,
        fontSize: 1,
        fontWeight: 100,
        route: new Route('authority-edit', {
          backendID: backend.asIdentifier(),
          authorityID: authority.id,
        }),
      }, [
        'edit',
      ]) : null,

    ]),

    h(Authority, { value: authority }),
  ])
}

module.exports = {
  label: 'Authority detail',
  description: 'Details of a hovered or focused period',
  Component: AuthorityDetail,
}
