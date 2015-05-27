"use strict";

require('babelify/polyfill');

var app = require('./app')
  , $ = require('jquery')

$(document).ready(() => app.start());
