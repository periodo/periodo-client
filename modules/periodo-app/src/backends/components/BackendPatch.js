"use strict";

const h = require('react-hyperscript')
    , Compare = require('../../patches/Compare')
    , { PatchDirection } = require('../../patches/types')
    , { Flex, Box, Link, Breadcrumb, Section } = require('periodo-ui')
    , { formatDate } = require('periodo-utils')
    , { Route } = require('org-shell')

const label = patch => `Change made ${
  formatDate(
    patch.change.mergeTime || new Date(patch.patch.created)
  )
}`

module.exports = function BackendPatch(props) {
  const { backend, patch } = props
  const { prevDataset, dataset, position: { prev, next }} = patch
  return (
    h(Box, [

      h(Breadcrumb, [
        h(Link, {
          route: Route('backend-home', {
            backendID: backend.asIdentifier(),
          }),
        }, backend.metadata.label),
        label(patch),
        'View',
      ]),

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
