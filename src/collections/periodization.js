"use strict";

var Backbone = require('../backbone')
  , Periodization = require('../models/periodization')

module.exports = Backbone.Collection.extend({
  model: Periodization
});
