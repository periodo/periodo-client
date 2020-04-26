"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Route } = require('org-shell')
    , { Box, Breadcrumb, Link } = require('periodo-ui')
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

      h(AuthorityLayoutRenderer, {
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
