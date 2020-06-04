"use strict";

const h = require('react-hyperscript')
    , { Link: ORGLink } = require('org-shell')
    , { Text } = require('./Base')

const Link = exports.Link = ORGLink(props =>
  h(Text, {
    as: 'a',
    sx: {
      color: 'blue.5',
      textDecoration: 'none',
      cursor: 'pointer',
      ':hover': {
        textDecoration: 'underline',
      },
    },
    ...props,
  }))

exports.ExternalLink = props =>
  h(Link, {
    target: '_blank',
    ...props,
  })
