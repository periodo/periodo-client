"use strict";

const h = require('react-hyperscript')
    , { Box } = require('periodo-ui')
    , { terminus: { earliestYear }} = require('periodo-utils')

module.exports = {
  label: 'Human time checkmarks',
  description: 'Filter out periods that occur before humans existed',
  makeFilter(opts={}) {
    const { cutoff='homo-sapiens' } = opts

    if (cutoff !== 'homo-sapiens') return null

    const earliest = -400001

    return period => {
      if (period.start == undefined) return false

      const earliestStart = earliestYear(period.start)

      return earliestStart != null && earliestStart > earliest
    }
  },
  Component: ({ cutoff='homo-sapiens', updateOpts }) =>
    h(Box, [
      h(Box, [
        h('label', [
          h('input', {
            type: 'radio',
            name: 'cutoff',
            value: 'none',
            checked: cutoff === 'none',
            onChange: () => updateOpts({ cutoff: 'none' }, true),
          }),
          'No cutoff',
        ]),
      ]),

      h(Box, [
        h('label', [
          h('input', {
            type: 'radio',
            name: 'cutoff',
            value: 'homo-sapiens',
            checked: cutoff === 'homo-sapiens',
            onChange: () => updateOpts({ cutoff: 'homo-sapiens' }, true),
          }),

          'Post-',
          h('i', 'Homo sapiens'),
          ' (after 300,000 years ago)',
        ]),
      ]),
    ]),
}
