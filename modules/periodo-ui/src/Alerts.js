"use strict";

const { Box } = require('./Base')
    , extend = require('./extend')

function makeAlert(color) {
  return extend(Box, {
    display: 'inline-block',
    p: 2,
    border: 1,
    fontSize: 1,
    fontWeight: 'bold',

    bg: `${color}.2`,
    color: `${color}.9`,
    borderColor: `${color}.6`,
  })
}

exports.Alert$Success = makeAlert('green')

exports.Alert$Error = makeAlert('red')
