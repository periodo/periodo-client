"use strict";

const h = require('react-hyperscript')
    , { InlineText } = require('./Base')

exports.Italic = props =>
  h(InlineText, {
    sx: {
      fontStyle: 'italic',
    },
    ...props,
  })

exports.InfoText = props =>
  h(InlineText, {
    sx: {
      fontStyle: 'italic',
      color: 'gray.8',
    },
    ...props,
  })

exports.WarnText = props =>
  h(InlineText, {
    sx: {
      fontStyle: 'italic',
      color: 'red.5',
    },
    ...props,
  })
