"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Text } = require('axs-ui')
    , Consumer = require('../Consumer')

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
    R.map(authority => ({
      authorities: authority.id,
      periods: R.map(R.prop('id'), R.values(authority.definitions))
    })),
    itemKeySetReducer,
    prev,
    items
  )
}

exports.handler = {
  label: 'Statistics',
  description: 'Simple stastics about the dataset.',
  Component: Consumer(next, Infinity, props =>
    h(Box, [
      h(Box, [
        h(Text, `There are ${props.data.periods.size} periods in ${props.data.authorities.size} authorities`)
      ])
    ])
  )
}
