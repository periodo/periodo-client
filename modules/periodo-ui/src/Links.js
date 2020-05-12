"use strict";

const { Link } = require('org-shell')
    , sys = require('system-components').default

exports.Link = Link(sys({
  is: 'a',
  color: 'blue.5',
}, 'space', 'display', 'fontSize', 'fontWeight', {
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
  cursor: 'pointer',
}))

exports.ExternalLink = Link(sys({
  is: 'a',
  color: 'blue.5',
  target: '_blank',
}, 'space', 'display', 'fontSize', 'fontWeight', {
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
}))
