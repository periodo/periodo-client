"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , Icon = require('react-geomicons').default
    , { useState } = require('react')
    , { Button } = require('./Buttons')
    , { Flex } = require('./Base')
    , { Select } = require('./FormElements')

function Pager({ total, limit, render }) {

  const [ start, setStart ] = useState(0)

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

  return h('div', [
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
  updateOpts,
}) {
  return h(Flex, {
    justifyContent: 'center',
    flex: '1 1 auto',
  }, [
    h(Button, {
      borderRadius: 0,
      disabled: start === 0,
      onClick: toFirstPage,
    }, h(Icon, {
      onMouseDown: e => {
        if (start === 0) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      name: 'previous',
      color: 'black',
    })),

    h(Button, {
      borderRadius: 0,
      disabled: start === 0,
      onClick: toPrevPage,
      ml: '-1px',
    }, h(Icon, {
      onMouseDown: e => {
        if (start === 0) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      name: 'triangleLeft',
      color: 'black',
    })),

    h(Select, {
      bg: 'gray.1',
      value: limit,
      minWidth: '60px',
      onChange: e => {
        updateOpts(R.set(
          R.lensProp('limit'),
          parseInt(e.target.value)
        ))
      },
    }, [ 10, 25, 50, 100, 250 ].map(n =>
      h('option', {
        key: n,
        value: n,
      }, `Show ${n}`),
    )),

    h(Button, {
      borderRadius: 0,
      disabled: start + shown >= total,
      onClick: toNextPage,
      mr: '-1px',
    }, h(Icon, {
      onMouseDown: e => {
        if (start + shown >= total) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      name: 'triangleRight',
      color: 'black',
    })),

    h(Button, {
      borderRadius: 0,
      disabled: start + shown >= total,
      onClick: toLastPage,
    }, h(Icon, {
      onMouseDown: e => {
        if (start + shown >= total) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      name: 'next',
      color: 'black',
    })),
  ])
}

module.exports = {
  Pager,
  PagerControls,
}
