"use strict";

const h = require('react-hyperscript')
    , { useState, useRef, useEffect } = require('react')
    , { Box, Span } = require('./Base')

const Tag = ({label, onDelete, ...props}) => h(Box, {
  is: 'li',
  tabIndex: 0,
  bg: 'gray.3',
  borderRadius: '2px',
  css: { cursor: 'default' },
  display: 'inline-block',
  px: 2,
  py: 1,
  onKeyUp: e => {
    if (e.key === 'Delete' || e.key == 'Backspace') {
      onDelete()
    }
  },
  ...props,
}, [
  label,
  h(Span, {
    color: 'gray.6',
    ml: 2,
    mt: 1,
    style: { cursor: 'pointer' },
    onClick: onDelete,
  }, '✕'),
])

// items must have { id, label }
const Tags = ({
  items,
  onFocus,
  onBlur,
  onDelete,
  ...props
}) => {

  const [focusedIndex, setFocusedIndex] = useState(-1)

  const ref = useRef()

  useEffect(() => {
    if (focusedIndex >= 0) {
      ref.current.childNodes[focusedIndex].focus()
    }
  }, [focusedIndex]);

  return h(Box, {
    is: 'ul',
    innerRef: ref,
    p: 0,
    mb: -1,
    css: { listStyleType: 'none' },
    ...props,
  }, items.map((item, index) => h(Tag, {
      key: item.id,
      label: item.label,
      mr: 1,
      mb: 1,
      onFocus: () => {
        onFocus(item)
        setFocusedIndex(index)
      },
      onBlur: () => {
        onBlur()
        setFocusedIndex(-1)
      },
      onDelete: () => {
        onBlur()
        onDelete(item)
        setFocusedIndex(index - 1)
      },
    }))
  )
}

module.exports = {
  Tag,
  Tags,
}
