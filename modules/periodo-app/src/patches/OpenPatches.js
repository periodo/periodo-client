"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box, Text, Link } = require('periodo-ui')
    , { Route } = require('org-shell')
    , PatchRequestLayout = require('../layouts/patch_requests')

const layout = `
[]
type = request-list
`

function ReviewPatches(props) {
  const { patchRequests, backend } = props
      , [ blockOpts, setBlockOpts ] = useState({})

  return (
    h(Box, [
      h(PatchRequestLayout, {
        layout,
        patchRequests,
        backend,
        blockOpts,
        onBlockOptsChange: setBlockOpts,
      })
    ])
  )

  return (
    h(Box, [
      h(Text, `${patchRequests.length} open patch requests`),
      h('ul', patchRequests.map(req =>
        h(Box, { is: 'li', mb: 2, key: req.url }, [
          h('div', [
            h(Link, {
              route: Route('review-patch', {
                patchURL: encodeURIComponent(req.url.replace(window.location.origin, '')),
              })
            }, [
              'Patch ',
              req.url.slice(0, -1).split('/').pop()
            ])
          ]),

          h('div', [
            'Created by ' + req.created_by.label + ' at ' + new Date(req.created_at),
          ]),
        ])
      ))
    ])
  )
}

module.exports = ReviewPatches;
