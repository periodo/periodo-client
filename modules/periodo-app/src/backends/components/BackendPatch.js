"use strict";

const h = require('react-hyperscript')
    , Compare = require('../../patches/Compare')

module.exports = function BackendPatch(props) {
  return (
    h(Compare, {
      localDataset: props.extra.prevDataset,
      remoteDataset: props.extra.dataset,
    })
  )
}
