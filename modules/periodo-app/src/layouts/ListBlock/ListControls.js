"use strict";

const h = require('react-hyperscript')
    , { Flex, PagerControls } = require('periodo-ui')
    , Counter = require('./Counter')
    , ColumnSelector = require('./ColumnSelector')

function ListControls({
  start,
  limit,
  total,
  shown,
  columns,
  shownColumns,
  toPrevPage,
  toNextPage,
  toFirstPage,
  toLastPage,
  updateOpts,
}) {
  return h(Flex, {
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 3,
  }, [

    h(Counter, {
      start,
      total,
      shown,
    }),

    h(PagerControls, {
      start,
      limit,
      total,
      shown,
      toFirstPage,
      toPrevPage,
      toNextPage,
      toLastPage,
      updateOpts,
    }),

    h(ColumnSelector, {
      columns,
      shownColumns,
      updateOpts,
    }),
  ])
}

module.exports = ListControls
