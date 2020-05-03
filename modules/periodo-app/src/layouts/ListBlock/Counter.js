"use strict";

const h = require('react-hyperscript')
    , { Box, Text } = require('periodo-ui')

function Counter({ start, total, shown }) {
  return h(Box, {
    textAlign: 'left',
    flex: '1 1 auto',
  }, [
    shown === 0
      ? null
      : h(Text,
        { mx: 2 },
        `${ start + 1 }–${ start + shown } of ${ total }`
      ),
  ])
}

module.exports = Counter
