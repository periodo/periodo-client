"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')

module.exports = props =>
  h(Box, [
    h('pre', JSON.stringify({ patches: props.patches }, true, '  ')),
  ])
