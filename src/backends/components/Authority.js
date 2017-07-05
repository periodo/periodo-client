"use strict";

const h = require('react-hyperscript')
    , { Box } = require('axs-ui')
    , { Source } = require('lib/ui')

module.exports =  props =>
  h(Box, [
    h(Source, { source: props.authority.source }),
  ])
