"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box, Label } = require('periodo-ui')
    , PatchRequestLayout = require('../layouts/patch_requests')

const layout = `
[]
type = request-list
`

function ReviewPatches(props) {
  const { patchRequests, backend } = props
      , [ blockOpts, setBlockOpts ] = useState({})
      , [ onlyOpen, setOnlyOpen ] = useState(false)

  let shownPatchRequests = patchRequests

  if (onlyOpen) {
    shownPatchRequests = shownPatchRequests.filter(p => p.open)
  }

  return (
    h(Box, [
      h(Box, [
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
          'Open patches only',
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
