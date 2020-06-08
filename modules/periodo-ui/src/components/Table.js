"use strict";

const h = require('react-hyperscript')
    , { Box } = require('rebass')

exports.Table = ({
  compact,
  hoverBG,
  ...props
}) =>
  h(Box, {
    as: 'table',
    sx: {
      width: '100%',
      borderSpacing: '4px 0',
      borderCollapse: 'collapse',
      bg: 'elements.table.body',

      '& td, & th': {
        py: compact ? '2px' : 2,
        px: compact ? '5px' : 3,
      },

      '& tr:hover': {
        bg: hoverBG || 'elements.table.hover',
      },

      '& th': {
        bg: 'elements.table.header',
        textAlign: 'left',
        fontWeight: 'bold',
      },
    },
    ...props,
  })
