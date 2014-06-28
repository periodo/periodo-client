"use strict";

var Backbone = require('backbone')
  , $ = require('jquery')
  , _ = require('underscore')

Backbone.$ = $;
require('backbone.stickit');
require('backbone-validation');
_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

module.exports = Backbone;
