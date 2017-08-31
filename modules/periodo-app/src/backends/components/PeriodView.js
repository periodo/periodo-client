"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')
    , { Period } = require('periodo-ui')

module.exports = ({ period }) =>
  h(Box, [
    h('pre', JSON.stringify(period, true, '  '))
  ])