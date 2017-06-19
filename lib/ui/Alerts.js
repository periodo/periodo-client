"use strict";

const { Box, config } = require('axs-ui')
    , extend = require('./extend')

function makeAlert(color) {
  return extend(Box, {
    p: 2,
    border: 2,
    rounded: true,
    fontSize: 4,

    bg: `${color}2`,
    color: `${color}9`,
    borderColor: `${color}6`,
  })
}

exports.Alert$Success = makeAlert('green')

exports.Alert$Error = makeAlert('red')
