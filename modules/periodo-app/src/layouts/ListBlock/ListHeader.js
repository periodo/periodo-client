"use strict";

const h = require('react-hyperscript')
    , { Box } = require('periodo-ui')

function ListHeader({
  columns,
  shownColumns,
  sortBy,
  sortDirection,
  firstColumnWidth,
  updateOpts,
  toFirstPage,
}) {
  return h(Box, {
    is: 'thead',
    mb: 1,
  }, [
    h(Box, {
      is: 'tr',
      bg: 'gray.1',
      textAlign: 'left',
    }, [
      h(Box, {
        is: 'th',
        key: 'first',
        style: { width: firstColumnWidth },
      }),
    ].concat(shownColumns.map(n =>
      h(Box, {
        is: 'th',
        key: n,
        p: 2,
        fontWeight: 'bold',
        style: {
          width: columns[n].width || 'unset',
          cursor: 'pointer',
        },
        onClick: () => {
          updateOpts((opts={}) => ({
            ...opts,
            sortBy: n,
            sortDirection: opts.sortBy === n
              ? (
                !opts.sortDirection ||
                opts.sortDirection === 'asc'
              )
                ? 'desc' : 'asc'
              : 'asc',
          }))
          toFirstPage()
        },
      }, [
        columns[n].label,
        n === sortBy && (
          sortDirection === 'desc' ? '▲' : '▼'
        ),
      ])
    ))),
  ])
}

module.exports = ListHeader
