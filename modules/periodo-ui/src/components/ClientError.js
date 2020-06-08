"use strict";

const h = require('react-hyperscript')
    , { Box, Heading, Pre } = require('./Base')

return ({ error, ...props }) =>
  h(Box, {
    ...props,
  }, [
    h(Heading, {
      level: '2',
      color: 'red.4',
      css: { 'letterSpacing': '4px' },
    }, 'Client error'),
    h(Box, {
      my: 2,
      style: {
        fontWeight: 'bold',
        fontSize: '16px',
      },
    }, [
      error.err.toString(),
    ]),
    h(Heading, {
      level: '4',
      mt: 2,
    }, 'Error stack'),
    h(Pre, {
      ml: 2,
    }, [
      error.err.stack,
    ]),
    h(Heading, {
      level: '4',
      mt: 2,
    }, 'Component stack'),
    h(Pre, error.info.componentStack.trim()),
  ])
