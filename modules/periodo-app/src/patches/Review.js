"use strict";

const h = require('react-hyperscript')
    , { Box, Text, Link } = require('periodo-ui')
    , { Route } = require('org-shell')
    , Compare = require('./Compare')
    , { PatchDirection } = require('./types')

function ReviewPatches(props) {
  return (
    h(Box, [
      h(Compare, {
        localDataset: props.fromDataset,
        remoteDataset: props.toDataset,
        patch: props.patchText,
        direction: PatchDirection.Pull,
      })
    ])
  )
}

module.exports = ReviewPatches;
