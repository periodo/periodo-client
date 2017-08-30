"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading } = require('axs-ui')
    , { Source } = require('periodo-ui')
    , AuthorityLayout = require('../../layouts/authorities')
    , { LayoutHaver } = require('org-layout-engine')


module.exports = LayoutHaver(({
  backend,
  authority,
  spec={ layouts: [{ name: 'list' }]},
  onSpecChange
}) =>
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
        spec,
        onSpecChange,
      }),
    ]),

  ])
)
