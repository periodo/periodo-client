"use strict";

var React = require('react')
  , { EventEmitter } = require('events')

require('babelify/polyfill');

window.periodo = new EventEmitter();

window.onload = function () {
  var Router = require('./router');
  React.render(<Router />, document.body);
}
