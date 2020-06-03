"use strict";

const { Span } = require('./Base')
    , { themeGet } = require('styled-system')

const Italic = exports.Italic = Span.extend([], [
  { fontStyle: 'italic' },
])

exports.InfoText = Italic.extend([], [
  props => ({
    color: themeGet('colors.gray.8')(props),
  }),
])

exports.WarnText = Italic.extend([], [
  props => ({
    color: themeGet('colors.red.5')(props),
  }),
])
