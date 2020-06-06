"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')

exports.Button = ({ sx, variant='default', ...props }) =>
  h(Box, {
    as: 'button',
    tx: 'buttons',
    variant,
    sx: {
      px: 3,
      py: 2,
      borderWidth: 1,
      borderStyle: 'solid',
      borderRadius: 4,
      fontSize: 1,
      fontWeight: 'bold',
      cursor: 'pointer',
      ':disabled': {
        cursor: 'not-allowed',
        opacity: .4,
      },
      ...sx,
    },
    ...props,
  })

exports.AriaButton = props =>
  h(Box, {
    as: 'span',
    role: 'button',
    tabIndex: 0,
    onKeyPress: e => {
      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onKeyUp: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        props.onSelect();
      }
    },
    onClick: props.onSelect,
    ...props,
  }, props.children)
