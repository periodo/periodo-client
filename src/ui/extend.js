"use strict";

const h = require('react-hyperscript')

module.exports = (Component, overrides) =>
  props => h(Component, Object.assign({}, overrides, props))

