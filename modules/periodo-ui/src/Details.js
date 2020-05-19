"use strict";

const h = require('react-hyperscript')
    , { useState, Children } = require('react')
    , { Box } = require('./Base')

function Details({
  summary,
  summaryProps={},
  children,
  onToggle,
  ...props
}) {
  const [ open, setOpen ] = useState(props.open || false)

  return h(Box, {
    is: 'details',
    open,
  }, [
    h(Summary, {
      ...summaryProps,
      onClick: e => {
        e.preventDefault()
        setOpen(prevOpen => !prevOpen)
        if (onToggle) { onToggle() }
      },
    }, [ summary ]),

    (typeof children === 'function')
      ? children(!open) // hidden: true
      : open ? Children.only(children) : null,
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
