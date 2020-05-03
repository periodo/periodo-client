"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Flex, PagerControls, PagerCounter } = require('periodo-ui')
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
    mb: 3,
  }, [

    h(PagerCounter, {
      flex: 1,
      start,
      total,
      shown,
    }),

    h(PagerControls, {
      flex: 0,
      start,
      limit,
      total,
      shown,
      toFirstPage,
      toPrevPage,
      toNextPage,
      toLastPage,
      onLimitChange: limit => updateOpts(R.set(R.lensProp('limit'), limit)),
    }),

    h(ColumnSelector, {
      flex: 1,
      textAlign: 'right',
      columns,
      shownColumns,
      updateOpts,
    }),
  ])
}

module.exports = ListControls
