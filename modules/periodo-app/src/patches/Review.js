"use strict";

const h = require('react-hyperscript')
    , { Box, Text } = require('periodo-ui')

function ReviewPatches(props) {
  const { patchRequests } = props.extra

  return (
    h(Box, [
      h(Text, `${patchRequests.length} open patch requests`),
      h('ul', patchRequests.map(req =>
        h('li', JSON.stringify(req))
      ))
    ])
  )
}

module.exports = ReviewPatches;
