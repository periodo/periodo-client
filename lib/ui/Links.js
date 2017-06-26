"use strict";

const h = require('react-hyperscript')
    , { Text } = require('axs')
    , { generateRoute } = require('../../src/router')

function hrefFromProps({ href, route, params }) {
  if (href) return href;

  if (params) return generateRoute(route, params);

  return undefined;
}

exports.Link = props =>
  h(Text, {
    is: 'a',
    color: 'blue',
    href: hrefFromProps(props),
    _css: {
      textDecoration: 'none',
      ':hover': {
        textDecoration: 'underline'
      }
    }
  }, props.children)
