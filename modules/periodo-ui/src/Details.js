"use strict";

const h = require('react-hyperscript')
    , { useState, Children } = require('react')
    , { Box } = require('./Base')

function Details({ summary, children }) {
  const [ open, setOpen ] = useState(false)

  return h(Box, {
    is: 'details',
    open,
    onToggle: () => setOpen(prevOpen => !prevOpen),
  }, [
    h(Summary, [ summary ]),
    open ? Children.only(children) : null,
  ])
}

function Summary({ css={}, ...props }) {
  return h(Box, {
    is: 'summary',
    css: {
      width: '100%',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#fff',
      },
      ...css,
    },
    ...props,
  })
}

module.exports = {
  Details,
  Summary,
}
