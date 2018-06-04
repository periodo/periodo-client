"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Text } = require('periodo-ui')
    , { blocks } = require('org-layouts')

function itemKeySetReducer(sets, item) {
  Object.keys(item).forEach(key => {
    const val = [].concat(item[key])
        , set = sets[key]

    val.forEach(set.add.bind(set))
  })

  return sets
}

const next = (prev, items) => {
  prev = prev || { authorities: new Set(), periods: new Set() }

  return R.transduce(
    R.map(({ authority, periods }) => ({
      authorities: authority.id,
      periods: Object.keys(periods),
    })),
    itemKeySetReducer,
    prev,
    items
  )
}

module.exports = {
  label: 'Statistics',
  description: 'Simple stastics about the dataset.',
  Component: blocks.StreamConsuming(next, 2)(props =>
    h(Box, [
      h(Box, [
        h(Text, `There are ${props.data.periods.size} periods in ${props.data.authorities.size} authorities`)
      ])
    ])
  )
}
