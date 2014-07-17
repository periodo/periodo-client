"use strict";

var Backbone = require('backbone')
  , $ = require('jquery')
  , _ = require('underscore')
  , store = {}

Backbone.$ = $;
require('backbone.stickit');
require('backbone-validation');
require('backbone-relational');

_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);
Backbone.Relational.store.addModelScope(store);

module.exports = Backbone;
