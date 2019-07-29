"use strict";

const { Box } = require('./Base')
    , extend = require('./extend')

function makeAlert(color) {
  return extend(Box, {
    p: 2,
    border: 1,
    borderRadius: '4px',
    fontSize: 2,

    bg: `${color}.2`,
    color: `${color}.9`,
    borderColor: `${color}.6`,
  })
}

exports.Alert$Success = makeAlert('green')

exports.Alert$Error = makeAlert('red')
