"use strict";

var $ = require('jquery')
  , Backbone = require('backbone')
  , sync = require('./sync')

module.exports = Backbone;

Backbone.$ = $;
require('backbone.stickit');
Backbone.ajaxSync = Backbone.sync;
Backbone.sync = sync;
