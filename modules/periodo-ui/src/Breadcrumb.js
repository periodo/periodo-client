"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')

exports.Breadcrumb = props =>
  h(Box, Object.assign({
    is: 'ol',
    py: 1,
    px: 2,
    mb: 2,
    bg: 'gray0',
    fontSize: 4,
    css: {
      listStyleType: 'none',
    }
  }, props), [].concat(props.children || []).map((el, i, arr) =>
    h(Box, {
      is: 'li',
      key: i,
      css: {
        display: 'inline-block',
        // TODO: Make this resize w/ flexbox
        maxWidth: `${100 / arr.length}%`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        ':not(:first-of-type)': {
          '::before': {
            content: '"\\203a"',
            color: '#999',
            margin: '0 8px',
          }
        }
      }
    }, el)
  ))
