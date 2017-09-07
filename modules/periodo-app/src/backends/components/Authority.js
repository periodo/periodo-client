"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading } = require('axs-ui')
    , { Source } = require('periodo-ui')
    , AuthorityLayoutEngine = require('../../layouts/authorities')
    , { TransientSpecEditor } = require('org-layouts')

const defaultSpec = {
  blocks: [
    { name: 'list' }
  ]
}

const AuthorityLayout = TransientSpecEditor(defaultSpec)(AuthorityLayoutEngine)

module.exports = ({ backend, authority }) =>
  h(Flex, [
    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Source'),

      h(Source, { value: authority.source }),
    ]),

    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Periods'),

      h(AuthorityLayout, {
        backend,
        dataset: {
          periodCollections: {
            [authority.id]: authority
          }
        },
      }),
    ]),
  ])
