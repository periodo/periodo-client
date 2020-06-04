"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')

exports.InlineList = props => {
  const { children=[], ...rest } = props

  return (
    h(Box, {
      ml: '1px',
      sx: {
        position: 'relative',
        overflow: 'hidden',
      },
      ...rest,
    }, [
      h(Box, {
        as: 'ul',
        sx: {
          ml: '-1px',
          listStyleType: 'none',
        },
      }, children.map((child, i) =>
        h(Box, {
          as: 'li',
          key: i,
          sx: {
            borderLeft: '1px solid #ccc',
            display: 'inline-block',
            px: 1,
          },
        }, child)
      )),
    ])
  )
}
