"use strict";

const R = require('ramda')
    , { Box } = require('./Base')

const Span = p => Box(R.merge(p, { is: 'span' }))

const Pre = p => Box(R.merge(p, { is: 'pre' }))

const Italic = p => Span(R.merge(p, { css: {fontStyle: 'italic'} }))

const ExternalLink = p => Box(R.merge(p, {
  is: 'a', target: '_blank', color: 'blue', css: { textDecoration: 'none' }
}))

const Info = p => Italic(R.merge(p, { color: 'darkgray' }))

const Warn = p => Italic(R.merge(p, { color: 'red' }))

module.exports = { Span, Pre, Italic, ExternalLink, Info, Warn }
