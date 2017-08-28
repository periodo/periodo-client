"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , PatchLayout = require('../../layouts/patches')
    , LayoutHaver = require('org-layout-engine/LayoutHaver')

module.exports = LayoutHaver(({
  patches,
  spec={ layouts: [{ name: 'patch-list' }] },
  onSpecChange,
}) =>
  h(Box, [
    h(PatchLayout, { patches, spec, onSpecChange, }),

    // h('pre', JSON.stringify(patches, true, '  ')),
  ])
)
