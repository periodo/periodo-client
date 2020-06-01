"use strict";

const h = require('react-hyperscript')
    , { useState, useRef, useEffect } = require('react')
    , { Box, Span } = require('./Base')

const Tag = ({ label, onDelete, ...props }) => h(Box, {
  is: 'li',
  tabIndex: 0,
  bg: 'gray.2',
  borderRadius: '2px',
  css: {
    cursor: 'default',
    border: '1px solid #adb5bd',
  },
  display: 'inline-block',
  minHeight: '26px',
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
    verticalAlign: 'top',
    style: { cursor: 'pointer' },
    onClick: () => { onDelete() },
  }, '✕'),
])

const SuggestedTag = ({ label, onAccept, ...props }) => h(Box, {
  is: 'li',
  tabIndex: 0,
  borderRadius: '2px',
  css: {
    cursor: 'default',
    border: '1px dashed #adb5bd',
  },
  display: 'inline-block',
  height: '26px',
  px: 2,
  py: 1,
  ...props,
}, [
  label,
  h(Span, {
    color: 'gray.6',
    ml: 2,
    mt: 1,
    fontWeight: 'bold',
    style: {
      cursor: 'pointer',
    },
    onClick: () => { onAccept() },
  }, '✓'),
])

const Message = ({ text, ...props }) =>  h(Span, {
  color: 'gray.6',
  height: '27px',
  display: 'inline-block',
  mr: 1,
  style: { lineHeight: '24px' },
  ...props,
}, text)

const listItem = child => h(
  'li', { style: { display: 'inline-block' }}, [ child ]
)

// items must have { id, label }
const Tags = ({
  items,
  suggestedItems,
  getItemKey = item => item.id,
  getItemLabel = item => item.label,
  editLink,
  onFocus,
  onBlur,
  onDeleteItem,
  onAcceptSuggestion,
  emptyMessage = '',
  suggestedTagsLabel = '',
  ...props
}) => {

  const [ focusedIndex, setFocusedIndex ] = useState(-1)

  const ref = useRef()

  useEffect(() => {
    if (focusedIndex >= 0) {
      ref.current.childNodes[focusedIndex].focus()
    }
  }, [ focusedIndex ]);

  const tagsOffset = items.length ? 0 : emptyMessage ? 1 : 0

  const tags = items.map((item, index) => h(Tag, {
    key: getItemKey(item),
    label: getItemLabel(item),
    mr: 1,
    mb: 1,
    onFocus: () => {
      onFocus(item)
      setFocusedIndex(index + tagsOffset)
    },
    onBlur: () => {
      onBlur()
      setFocusedIndex(-1)
    },
    onDelete: () => {
      onBlur()
      onDeleteItem(item)
      if ((index + tagsOffset) === focusedIndex) {
        setFocusedIndex(index + tagsOffset - 1)
      }
    },
  }))

  const suggestedTagsOffset = items.length + (suggestedTagsLabel ? 1 : 0)

  const suggestedTags = suggestedItems.map((item, index) => h(SuggestedTag, {
    key: getItemKey(item),
    label: getItemLabel(item),
    mr: 1,
    mb: 1,
    onFocus: () => {
      onFocus(item)
      setFocusedIndex(index + suggestedTagsOffset)
    },
    onBlur: () => {
      onBlur()
      setFocusedIndex(-1)
    },
    onAccept: () => {
      onBlur()
      onAcceptSuggestion(item)
      if ((index + suggestedTagsOffset) === focusedIndex) {
        setFocusedIndex(index + suggestedTagsOffset - 1)
      }
    },
  }))

  const children = [
    ...(tags.length
      ? tags
      : [ listItem(h(Message, { text: emptyMessage })) ]
    ),

    (suggestedTags.length && suggestedTagsLabel)
      ? listItem(
        h(Message, {
          text: suggestedTagsLabel,
          ml: tags.length ? 1 : 0,
        })
      )
      : null,

    ...suggestedTags,

    editLink ? listItem(editLink) : null,
  ]

  return h(Box, {
    is: 'ul',
    innerRef: ref,
    p: 0,
    mb: -1,
    css: {
      listStyleType: 'none',
    },
    ...props,
  }, children)

}

module.exports = {
  Tag,
  Tags,
}
