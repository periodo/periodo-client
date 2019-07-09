"use strict";

const h = require('react-hyperscript')
    , { Box } = require('periodo-ui')
    , { BackendContext, Period } = require('periodo-ui')

module.exports = ({ period }) => h(Box, [
    h(Period, { value: period }),
])
