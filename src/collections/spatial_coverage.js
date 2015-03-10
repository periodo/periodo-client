"use strict";

var Backbone = require('../backbone')
  , SpatialItem = require('../models/spatial_item')

module.exports = Backbone.Collection.extend({
  model: function (attrs, options) {
    return SpatialItem.create(attrs, options);
  }
});
