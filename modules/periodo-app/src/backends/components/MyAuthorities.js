"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box } = require('periodo-ui')
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
