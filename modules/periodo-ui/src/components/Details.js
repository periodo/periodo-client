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

  return (
    h(Box, {
      as: 'details',
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
  )
}

function Summary({ ...props }) {
  return (
    h(Box, {
      as: 'summary',
      sx: {
        width: '100%',
        color: 'colorsets.page.fg',
        cursor: 'pointer',
        pl: 1,
        pb: 2,
        ':hover': {
          cursor: 'pointer',
          opacity: .5,
        },
      },
      ...props,
    })
  )
}

module.exports = {
  Details,
  Summary,
}
