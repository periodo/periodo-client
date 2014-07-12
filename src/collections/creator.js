"use strict";

var Backbone = require('../backbone')
  , Creator = require('../models/creator')

module.exports = Backbone.Collection.extend({
  model: Creator
})
