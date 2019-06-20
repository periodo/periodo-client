"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { alternateLabels } = require('periodo-utils/src/period')

const _alternateLabels = R.memoizeWith(R.identity, alternateLabels)

module.exports = {
  label: 'Text search',
  description: 'Search for periods by text.',
  makeFilter(opts) {
    const text = opts && opts.text

    if (!text) return null

    const regex = text && new RegExp(text, 'i')

    return period => (
      regex.test(period.label) ||
      _alternateLabels(period).some(label => regex.test(label.value))
    )
  },
  Component: props =>
    h('label', [
      'Search: ',
      h('input', {
        type: 'text',
        value: props.opts.text || '',
        onChange: e => {
          const text = e.target.value
              , invalidate = text.slice(-1) !== '|'

          props.updateOpts({ text }, invalidate)
        }
      }),
    ])
}
