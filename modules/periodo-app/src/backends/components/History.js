"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')
    , PatchLayoutEngine = require('../../layouts/patches')
    , { TransientSpecEditor } = require('org-layouts')

const defaultSpec = {
  blocks: [
    { name: 'patch-list' }
  ]
}

const PatchLayout = TransientSpecEditor(defaultSpec)(PatchLayoutEngine)

module.exports = ({ patches }) =>
  h(Box, [
    h(PatchLayout, { patches }),

    // h('pre', JSON.stringify(patches, true, '  ')),
  ])
