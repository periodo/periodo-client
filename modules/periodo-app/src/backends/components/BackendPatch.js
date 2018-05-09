"use strict";

const h = require('react-hyperscript')
    , Compare = require('../../patches/Compare')
    , { PatchDirection } = require('../../patches/types')

module.exports = function BackendPatch(props) {
  return (
    h(Compare, {
      direction: PatchDirection.Pull,
      localDataset: props.extra.prevDataset,
      remoteDataset: props.extra.dataset,
    })
  )
}
