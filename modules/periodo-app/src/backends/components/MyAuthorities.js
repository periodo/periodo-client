"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Route } = require('org-shell')
    , { Box, Breadcrumb, Link, HelpText } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')

const layout = `
[AuthorityList]
type = authority-list
`

module.exports = function MyAuthorities({
  dataset,
  backend,
  authorityIDs,
}) {
  const [ blockOpts, setBlockOpts ] = useState({})

  return (
    h(Box, [

      h(Breadcrumb, [
        h(Link, {
          route: Route('backend-home', {
            backendID: backend.asIdentifier(),
          }),
        }, backend.metadata.label),
        'Browse authorities',
      ]),

      dataset.authorities.length === 0
        ? h(HelpText, [
          'No authorities in this data source.',
          h(Link, {
            mx: 1,
            route: new Route('backend-add-authority', {
              backendID: backend.asIdentifier(),
            }),
          }, 'Add an authority'),
          'or',
          h(Link, {
            mx: 1,
            route: new Route('backend-sync', {
              backendID: backend.asIdentifier(),
            }),
          }, 'import changes'),
          'from another data source.',
        ])
        : h(AuthorityLayoutRenderer, {
          layout,
          dataset,
          backend,
          filter: authority => authorityIDs.has(authority.id),
          useAuthorities: true,
          blockOpts,
          onBlockOptsChange: setBlockOpts,
        }),
    ])
  )
}
