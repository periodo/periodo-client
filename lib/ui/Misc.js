"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')
    , linkify = require('./linkify')

const Span = props => Box(R.merge(props, { is: 'span' }))

const Italic = props => Span(R.merge(props, { css: {fontStyle: 'italic'} }))

const didChange = (oldValue, newValue) => (
  ! (newValue === undefined || newValue === oldValue)
)

function Link(props) {
  const { url, changed = {} } = props
      , p = R.omit(['url', 'changed'], props)
  return didChange(url, changed.url)
    ? h(Diff, R.merge(p, { text: url, changed: { text: changed.url }}))
    : h(Box,  R.merge(p, { is: 'a', href: url }), url)
}

function Text(props) {
  const { text, changed = {}, links = false } = props
      , p = R.omit(['text', 'changed', 'links'], props)
  return didChange(text, changed.text)
    ? h(Diff, R.merge(p, { text, changed: { text: changed.text }}))
    : links
        ? h(
            Span,
            R.merge(p, { dangerouslySetInnerHTML: { __html: linkify(text) }})
          )
        : h(Span, p, text)
}

const LinkifiedText = props => Text(R.merge(props, { links: true }))

module.exports = { Span, Italic, Link, Text, LinkifiedText }
