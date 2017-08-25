"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading } = require('axs-ui')
    , { Source } = require('lib/ui')
    , AuthorityLayout = require('../../layouts/authorities')
    , LayoutHaver = require('lib/layout-engine/LayoutHaver')


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
