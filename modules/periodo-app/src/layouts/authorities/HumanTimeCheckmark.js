"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , through = require('through2')
    , { Box } = require('periodo-ui')
    , { terminus: { earliestYear} } = require('periodo-utils')

module.exports = {
  label: 'Human time checkmarks',
  description: 'Filter out periods that occur before humans existed',
  makeOutputStream(opts={}) {
    const { cutoff='homo-sapiens' } = opts

    let earliest = -Infinity

    if (cutoff === 'homo-sapiens') {
      earliest = -400001
    }

    return through.obj(function ({ authority, definitions }, enc, cb) {
      const matchedDefinitions = R.filter(period => {
        if (!period.start) return false;

        const earliestStart = earliestYear(period.start)

        return earliestStart != null && earliestStart > earliest
      })(definitions)

      if (R.isEmpty(definitions) || !R.isEmpty(matchedDefinitions)) {
        this.push({
          authority,
          definitions: matchedDefinitions,
        })
      }

      cb();
    })
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
            onChange: () => updateOpts({ cutoff: 'none' }, true)
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
            onChange: () => updateOpts({ cutoff: 'homo-sapiens' }, true)
          }),

          'Post-',
          h('i', 'Homo sapiens'),
          ' (after 300,000 years ago)',
        ])
      ]),
    ])
}
