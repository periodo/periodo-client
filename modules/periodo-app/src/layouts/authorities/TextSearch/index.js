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

    return through.obj(function ({ authority, periods }, enc, cb) {
      const matchedPeriods = R.filter(period =>
        regex.test(period.label) ||
        alternateLabels(period).some(label => regex.test(label.value))
      )(periods)

      if (!R.isEmpty(matchedPeriods)) {
        this.push({
          authority,
          periods: matchedPeriods,
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
              , invalidate = text.slice(-1) !== '|'

          props.updateOpts({ text }, invalidate)
        }
      }),
    ])
}
