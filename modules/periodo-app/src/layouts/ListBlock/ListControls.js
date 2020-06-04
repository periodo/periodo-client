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
    justifyContent: 'space-between',
    mb: 3,
  }, [

    h(PagerCounter, {
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
      onLimitChange: limit => updateOpts(R.set(R.lensProp('limit'), limit)),
    }),

    h(ColumnSelector, {
      textAlign: 'right',
      columns,
      shownColumns,
      updateOpts,
    }),
  ])
}

module.exports = ListControls
