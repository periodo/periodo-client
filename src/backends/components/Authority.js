"use strict";

const h = require('react-hyperscript')
    , { Box, Heading } = require('axs-ui')
    , { Source } = require('lib/ui')
    , AuthorityLayout = require('../../layouts/authorities')

module.exports = ({ backend, authority }) =>
  h(Box, [
    h(Heading, { level: 2 }, 'Source'),

    h(Source, { source: authority.source }),

    h(Heading, { level: 2 }, 'Periods'),

    h(AuthorityLayout, {
      backend,
      dataset: {
        periodCollections: {
          [authority.id]: authority
        }
      },
      spec: {
        groups: [
          {
            layouts: [
              { name: 'list' },
            ]
          }
        ]
      },
      updateLayoutOpts: () => null,
    }),
  ])
