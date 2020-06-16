"use strict";

const h = require('react-hyperscript')
    , Compare = require('../../patches/Compare')
    , { PatchDirection } = require('../../patches/types')
    , { Flex, Box, Link, Section } = require('periodo-ui')
    , { Route } = require('org-shell')

module.exports = function BackendPatch(props) {
  const { backend, patch } = props
      , { prevDataset, dataset, position: { prev, next }} = patch

  return (
    h(Box, [
      h(Flex, {
        justifyContent: 'space-between',
        mb: 1,
      }, [
        h(Box, prev && [
          h(Link, {
            route: Route('backend-patch', {
              backendID: backend.storage.asIdentifier(),
              patchID: prev.url,
            }),
          }, '≪ Previous change'),
        ]),

        h(Box, next && [
          h(Link, {
            route: Route('backend-patch', {
              backendID: backend.storage.asIdentifier(),
              patchID: next.url,
            }),
          }, 'Next change ≫'),
        ]),
      ]),

      h(Section, [
        h(Compare, {
          direction: PatchDirection.Pull,
          localDataset: prevDataset,
          remoteDataset: dataset,
        }),
      ]),
    ])
  )
}
