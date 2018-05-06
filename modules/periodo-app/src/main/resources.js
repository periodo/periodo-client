"use strict";

const h = require('react-hyperscript')
    , { Box, Heading } = require('periodo-ui')
    , { Period, Source, Authority, Dataset, Patch } = require('periodo-ui')
    , example = require('./example-data')

module.exports = {

  'test-period': {
    Component: () => h(Box, [
      h(Heading, 'before'),
      h(Period, { value: example.period.maximal }),
      h(Heading, {mt: 2}, 'after'),
      h(Period, { value: example.period.maximalAltered }),
      h(Heading, {mt: 2}, 'diff'),
      h(Period,
        { value: example.period.maximal
        , compare: example.period.maximalAltered
        }
      ),
    ])
  },

  'test-source': {
    Component: () => h(Box, [
      h(Heading, 'before'),
      h(Source, { value: example.source.maximal }),
      h(Heading, {mt: 2}, 'after'),
      h(Source, { value: example.source.maximalAltered }),
      h(Heading, {mt: 2}, 'diff'),
      h(Source,
        { value: example.source.maximal
        , compare: example.source.maximalAltered
        }
      ),
    ])
  },

  'test-authority': {
    Component: () => h(Box, [
      h(Heading, 'before'),
      h(Authority, { value: example.authority.maximal }),
      h(Heading, {mt: 2}, 'after'),
      h(Authority, { value: example.authority.maximalAltered }),
      h(Heading, {mt: 2}, 'diff'),
      h(Authority,
        { value: example.authority.maximal
        , compare: example.authority.maximalAltered
        }
      ),
    ])
  },

  'test-dataset': {
    Component: () => h(Box, [
      h(Heading, 'before'),
      h(Dataset, { value: example.dataset.maximal }),
      h(Heading, {mt: 2}, 'after'),
      h(Dataset, { value: example.dataset.maximalAltered }),
      h(Heading, {mt: 2}, 'diff'),
      h(Dataset,
        { value: example.dataset.maximal
        , compare: example.dataset.maximalAltered
        }
      ),
    ])
  },

  'test-patch': {
    Component: () => h(Box, [
      h(Heading, 'minimal'),
      h(Patch,
        { patch: example.patch.minimal
        , data: example.dataset.minimal
        }
      ),
      h(Heading, 'minimal reversed'),
      h(Patch,
        { patch: example.patch.minimalReverse
        , data: example.dataset.minimalAltered
        }
      ),
      h(Heading, 'maximal'),
      h(Patch,
        { patch: example.patch.maximal
        , data: example.dataset.maximal
        }
      ),
      h(Heading, 'maximal reversed'),
      h(Patch,
        { patch: example.patch.maximalReverse
        , data: example.dataset.maximalAltered
        }
      ),
    ])
  }

}
