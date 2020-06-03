"use strict";

const h = require('react-hyperscript')

exports.Debug = props =>
  h('pre', {}, JSON.stringify(props, true, '  '))
