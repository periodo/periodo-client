"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs')

exports.Breadcrumb = props =>
  h(Box, Object.assign({
    is: 'ol',
    py: 1,
    px: 2,
    mb: 2,
    bg: 'gray1',
    fontSize: 4,
    css: {
      listStyleType: 'none',
    }
  }, props), [].concat(props.children || []).map((el, i) =>
    h(Box, {
      is: 'li',
      key: i,
      css: {
        display: 'inline-block',
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
