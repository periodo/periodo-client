"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')
    , linkify = require('./linkify')

const Span = props => Box(R.merge(props, { is: 'span' }))
exports.Span = Span

const Italic = props => Span(R.merge(props, { css: {fontStyle: 'italic'} }))
exports.Italic = Italic

function Link(props) {
  const { url } = props
  return h(Box, R.merge(R.omit(['url'], props), { is: 'a', href: url }), url)
}
exports.Link = Link

function Text(props) {
  const { text, links = false, changed = {} } = props
      , otherProps = R.omit(['text', 'links', 'changed'], props)
  return changed.text
    ? h(Box, otherProps, h(Diff, { text, changed: changed.text }))
    : links
        ? h(Box, R.merge(otherProps,
            { dangerouslySetInnerHTML: { __html: linkify(text) }}
          ))
        : h(Box, otherProps, text)
}
exports.Text = Text
exports.LinkifiedText = props => Text(R.merge(props, { links: true }))
