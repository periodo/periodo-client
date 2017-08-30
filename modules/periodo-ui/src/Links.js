"use strict";

const h = require('react-hyperscript')
    , { Text } = require('axs')
    , { Link } = require('org-shell')

exports.Link = Link(props =>
  h(Text, Object.assign({}, props, {
    is: 'a',
    color: 'blue',
    _css: {
      textDecoration: 'none',
      ':hover': {
        textDecoration: 'underline'
      }
    }
  }), props.children)
)
