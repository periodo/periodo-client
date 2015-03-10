"use strict";

var Backbone = require('../backbone')
  , Period = require('../models/period')

module.exports = Backbone.Collection.extend({
  model: function (attrs, options) {
    return Period.create(attrs, options);
  }
});
