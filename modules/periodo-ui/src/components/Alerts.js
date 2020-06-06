"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')

exports.Alert = ({ variant='warning', ...props }) =>
  h(Box, {
    variant,
    tx: 'alerts',
    sx: {
      p: 2,
      borderWidth: 1,
      borderStyle: 'solid',
      fontSize: 1,
      fontWeight: 'bold',
    },
    ...props,
  })
