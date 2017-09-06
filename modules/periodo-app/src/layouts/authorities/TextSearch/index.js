"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , through = require('through2')
    , { alternateLabels } = require('periodo-utils/src/period')


module.exports = {
  label: 'Text search',
  description: 'Search for periods by text.',
  makeOutputStream(opts) {
    const text = opts && opts.text
        , regex = text && new RegExp(text, 'i')

    if (!text) return through.obj()

    return through.obj(function ({ authority, definitions }, enc, cb) {
      const matchedDefinitions = R.filter(period =>
        regex.test(period.label) ||
        alternateLabels(period).some(label => regex.test(label.value))
      )(definitions)

      if (!R.isEmpty(matchedDefinitions)) {
        this.push({
          authority,
          definitions: matchedDefinitions,
        })
      }

      cb();
    })
  },
  Component: props =>
    h('label', [
      'Search: ',
      h('input', {
        type: 'text',
        value: props.text || '',
        onChange: e => {
          const text = e.target.value

          props.updateOpts(R.assoc('text', text))
          if (text.slice(-1) !== '|') {
            props.invalidate();
          }
        }
      }),
    ])
}
