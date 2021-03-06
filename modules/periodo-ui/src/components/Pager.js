"use strict";

const h = require('react-hyperscript')
    , { useState, useEffect } = require('react')
    , { Button } = require('./Buttons')
    , { Flex, Box, Text } = require('./Base')
    , { Select } = require('./FormElements')
    , { FirstIcon, PrevIcon, NextIcon, LastIcon } = require('./Icons')

function Pager({ total, limit, render }) {

  const [ start, setStart ] = useState(0)

  useEffect(() => setStart(0), [ total, limit ])

  function toPrevPage() {
    setStart(Math.max(0, start - limit))
  }
  function toNextPage() {
    const nextStart = start + limit
    setStart(nextStart < total ? nextStart : start)
  }
  function toFirstPage() {
    setStart(0)
  }
  function toLastPage() {
    let page = 0
    while (page * limit < total) page++
    page--
    setStart(page * limit)
  }

  return (
    h('div', [
      render({
        start,
        limit,
        total,
        shown: (start + limit) > total ? (total - start) : limit,
        toPrevPage,
        toNextPage,
        toFirstPage,
        toLastPage,
      }),
    ])
  )
}

function PagerControls({
  start,
  limit,
  total,
  shown,
  toFirstPage,
  toPrevPage,
  toNextPage,
  toLastPage,
  onLimitChange,
  ...props
}) {
  return (
    h(Flex, {
      sx: {
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      ...props,
    }, [
      h(Button, {
        borderRadius: 0,
        disabled: start === 0,
        onClick: toFirstPage,
      }, h(FirstIcon, {
        onMouseDown: e => {
          if (start === 0) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
      })),

      h(Button, {
        borderRadius: 0,
        disabled: start === 0,
        onClick: toPrevPage,
        ml: '-1px',
      }, h(PrevIcon, {
        onMouseDown: e => {
          if (start === 0) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
      })),

      h(Select, {
        bg: 'gray.1',
        value: limit,
        minWidth: '60px',
        onChange: e => onLimitChange(parseInt(e.target.value)),
      }, [ 10, 25, 50, 100, 250 ].map(n =>
        h('option', {
          key: n,
          value: n,
        }, `Show ${n}`)
      )),

      h(Button, {
        borderRadius: 0,
        disabled: start + shown >= total,
        onClick: toNextPage,
        mr: '-1px',
      }, h(NextIcon, {
        onMouseDown: e => {
          if (start + shown >= total) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
      })),

      h(Button, {
        borderRadius: 0,
        disabled: start + shown >= total,
        onClick: toLastPage,
      }, h(LastIcon, {
        onMouseDown: e => {
          if (start + shown >= total) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
      })),
    ])
  )
}

function PagerCounter({ start, total, shown, ...props }) {
  return (
    h(Box, props, [
      shown === 0 ? null : (
        h(Text, [
          `${ start + 1 }–${ start + shown } of ${ total }`,
        ])
      ),
    ])
  )
}

module.exports = {
  Pager,
  PagerControls,
  PagerCounter,
}
