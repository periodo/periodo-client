"use strict";

const h = require('react-hyperscript')

module.exports = props =>
  h('pre', {}, JSON.stringify(props, true, '  '))
