"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Route } = require('org-shell')
    , { Box, Label, Breadcrumb, Link } = require('periodo-ui')
    , PatchRequestLayout = require('../layouts/patch_requests')

const layout = `
[]
type = request-list
`

function ReviewPatches(props) {
  const { patchRequests, backend } = props
      , [ blockOpts, setBlockOpts ] = useState({})
      , [ onlyOpen, setOnlyOpen ] = useState(true)

  let shownPatchRequests = patchRequests

  if (onlyOpen) {
    shownPatchRequests = shownPatchRequests.filter(p => p.open)
  }

  return (
    h(Box, [

      h(Breadcrumb, [
        h(Link, {
          route: Route('backend-home', {
            backendID: backend.asIdentifier(),
          }),
        }, backend.metadata.label),
        'Review submitted changes',
      ]),

      h(Box, { mb: 1 }, [
        h(Label, {
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        }, [
          h('input', {
            type: 'checkbox',
            checked: onlyOpen,
            onChange: () => {
              setOnlyOpen(!onlyOpen)
            },
          }),
          'Open submissions only',
        ]),
      ]),

      h(PatchRequestLayout, {
        layout,
        patchRequests: shownPatchRequests,
        backend,
        blockOpts,
        onBlockOptsChange: setBlockOpts,
      }),
    ])
  )
}

module.exports = ReviewPatches;
