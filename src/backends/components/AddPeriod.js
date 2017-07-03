"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')
    , PeriodForm = require('../../editors/PeriodForm')

module.exports = props =>
  h(Box, [
    h(PeriodForm),
  ])
