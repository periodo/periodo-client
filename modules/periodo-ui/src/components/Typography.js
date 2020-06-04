"use strict";

const h = require('react-hyperscript')
    , { Span } = require('./Base')

exports.Italic = props =>
  h(Span, {
    sx: {
      fontStyle: 'italic',
    },
    ...props,
  })

exports.InfoText = props =>
  h(Span, {
    sx: {
      fontStyle: 'italic',
      color: 'gray.8',
    },
    ...props,
  })

exports.WarnText = props =>
  h(Span, {
    sx: {
      fontStyle: 'italic',
      color: 'red.5',
    },
    ...props,
  })
