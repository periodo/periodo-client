"use strict";

const h = require('react-hyperscript')
    , Compare = require('../../patches/Compare')
    , { PatchDirection } = require('../../patches/types')
    , { Flex, Box, Link } = require('periodo-ui')
    , { Route } = require('org-shell')

module.exports = function BackendPatch(props) {
  const { backend, patch } = props

  const { prevDataset, dataset, position: { prev, next }} = patch
  return (
    h(Box, [
      h(Flex, {
        justifyContent: 'space-between',
      }, [
        h(Box, prev && [
          h(Link, {
            route: Route('backend-patch', {
              backendID: backend.storage.asIdentifier(),
              patchID: prev.url,
            }),
          }, '<< Prev'),
        ]),

        h(Box, next && [
          h(Link, {
            route: Route('backend-patch', {
              backendID: backend.storage.asIdentifier(),
              patchID: next.url,
            }),
          }, 'Next >>'),
        ]),
      ]),

      h(Compare, {
        direction: PatchDirection.Pull,
        localDataset: prevDataset,
        remoteDataset: dataset,
      }),
    ])
  )
}
