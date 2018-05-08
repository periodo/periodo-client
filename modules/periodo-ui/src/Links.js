"use strict";

const h = require('react-hyperscript')
    , { Text } = require('./Base')
    , { Link } = require('org-shell')
    , sys = require('system-components').default

exports.Link = Link(sys({
  is: 'a',
  color: 'blue.4',
}, 'space', 'display', {
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline'
  }
}))
