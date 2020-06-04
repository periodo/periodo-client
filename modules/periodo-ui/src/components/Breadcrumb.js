"use strict";

const h = require('react-hyperscript')
    , { Flex, Box } = require('./Base')

exports.Breadcrumb = ({ children, truncate=[], ...props }) =>
  h(Flex, {
    as: 'ol',
    sx: {
      maxWidth: 'calc(100vw - 44px)',
      ml: 1,
      mb: 3,
      listStyleType: 'none',
    },
    ...props,
  }, [].concat(children || []).map((el, i) =>
    h(Box, {
      as: 'li',
      key: i,
      sx: {
        color: 'gray.7',
        display: 'inline-block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        ...(
          truncate.includes(i) ? {} : { flex: '0 0 auto' }
        ),
        ':not(:first-of-type)': {
          '::before': {
            content: '"\\203a"',
            color: '#999',
            margin: '0 8px',
          },
        },
      },
    }, el)
  ))
