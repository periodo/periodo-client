"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')

exports.InlineList = ({css, ...props}) => h(Box, {
  ml: '1px',
  css: { position: 'relative', overflow: 'hidden', ...css },
  ...props,
}, [
  h(Box, {
    is: 'ul',
    ml: '-1px',
    css: { listStyleType: 'none' },
  }, [].concat(props.children || []).map((el, i) =>
    h(Box, {
      is: 'li',
      key: i,
      borderLeft: '1px solid #ccc',
      display: 'inline-block',
      px: 1,
    }, el)
  )),
])
