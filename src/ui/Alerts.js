"use strict";

const { Box, config } = require('axs-ui')
    , extend = require('./extend')

function makeAlert(color) {
  return extend(Box, {
    p: 2,
    border: 2,
    rounded: true,
    fontSize: 4,

    bg: config[`${color}2`],
    color: config[`${color}9`],
    borderColor: config[`${color}6`],
  })
}

exports.SuccessAlert = makeAlert('green')

exports.ErrorAlert = makeAlert('red')
