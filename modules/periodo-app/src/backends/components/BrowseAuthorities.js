"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Route } = require('org-shell')
    , { Box, Link, HelpText } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')

const layout = `
[Search]
type = authority-search
section = untitled

[AuthorityList]
type = authority-list
section = untitled
`

module.exports = function BrowseAuthorities({
  dataset,
  backend,
  authorityIDs,
}) {
  const [ blockOpts, setBlockOpts ] = useState({})

  return (
    h(Box, [
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
          data: dataset.authorities.filter(
            authority => authorityIDs.has(authority.id)
          ),
          layout,
          dataset,
          backend,
          blockOpts,
          onBlockOptsChange: setBlockOpts,
        }),
    ])
  )
}
