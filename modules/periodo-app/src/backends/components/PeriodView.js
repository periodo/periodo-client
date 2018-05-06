"use strict";

const h = require('react-hyperscript')
    , { Box } = require('periodo-ui')
    , { Period } = require('periodo-ui')

module.exports = ({ period }) =>
  h(Box, [
    h(Period, { value: period }),
  ])
