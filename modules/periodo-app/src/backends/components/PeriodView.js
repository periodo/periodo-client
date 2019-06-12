"use strict";

const h = require('react-hyperscript')
    , { Box } = require('periodo-ui')
    , { BackendContext, Period } = require('periodo-ui')

module.exports = ({ period, backend }) => h(Box, [
  h(BackendContext.Provider, { value: backend }, [
    h(Period, { value: period }),
  ])
])
