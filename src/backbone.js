"use strict";

var $ = require('jquery')
  , Backbone = require('backbone')
  , sync = require('./sync')

module.exports = Backbone;

Backbone.$ = $;
require('backbone.stickit');
require('backbone-relational');
Backbone.ajaxSync = Backbone.sync;
Backbone.sync = sync;
