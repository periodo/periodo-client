"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , Ignorer = require('../Ignorer')
    , { getAlternateLabels } = require('../../items/items/period')


exports.filterItems = function (period, opts) {
  const text = opts && opts.text
      , regex = text && new RegExp(text, 'i')

  if (!text) return true;

  return (
    regex.test(period.label) ||
    getAlternateLabels(period).some(label => regex.test(label))
  )
}

exports.handler = {
  label: 'Text search',
  description: 'Search for periods by text.',
  Component: Ignorer(({ updateOpts, text }) =>
    h('label', [
      'Search: ',
      h('input', {
        type: 'text',
        value: text || '',
        onChange: e => {
          updateOpts(R.assoc('text', e.target.value))
        }
      }),
    ])
  )
}
