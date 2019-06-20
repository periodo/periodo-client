"use strict";

const h = require('react-hyperscript')
    , { Box, Text } = require('periodo-ui')
    , { period: { authorityOf }} = require('periodo-utils')

function countAuthorities(data) {
  const s = new Set()

  data.forEach(period => {
    s.add(authorityOf(period))
  })

  return s.size
}

module.exports = {
  label: 'Statistics',
  description: 'Simple stastics about the dataset.',
  Component: props =>
    h(Box, [
      h(Box, [
        h(Text, `There are ${props.data.length} periods in ${countAuthorities(props.data)} authorities`)
      ])
    ])
}
