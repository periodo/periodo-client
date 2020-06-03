"use strict";

const h = require('react-hyperscript')
    , { Box } = require('./Base')

// FIXME: Change these to variants

function makeAlert(color) {
  return props =>
    h(Box, {
      sx: {
        p: 2,
        border: 1,
        fontSize: 1,
        fontWeight: 'bold',

        bg: `${color}.2`,
        color: `${color}.9`,
        borderColor: `${color}.6`,
      },
      ...props,
    })
}

exports.Alert$Warning = makeAlert('yellow')

exports.Alert$Success = makeAlert('green')

exports.Alert$Error = makeAlert('red')
