"use strict";

const h = require('react-hyperscript')
    , { Box } = require('rebass')

exports.Table = ({
  compact,
  secondary,
  ...props
}) => {
  const colorset = secondary
    ? 'colorsets.tableSecondary'
    : 'colorsets.table'

  return (
    h(Box, {
      as: 'table',
      sx: {
        width: '100%',
        borderSpacing: '4px 0',
        borderCollapse: 'collapse',
        bg: `${colorset}.bg`,
        color: `${colorset}.fg`,

        '& td, & th': {
          py: compact ? 1 : 2,
          px: compact ? 2 : 3,
        },

        '& tr:hover': {
          bg: `${colorset}Focused.bg`,
          color: `${colorset}Focused.fg`,
        },

        '& th': {
          bg: 'colorsets.secondary.bg',
          color: 'colorsets.secondary.fg',
          textAlign: 'left',
          fontWeight: 'bold',
        },
      },
      ...props,
    })
  )
}
