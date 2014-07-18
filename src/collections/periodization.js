"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Periodization = require('../models/periodization')

module.exports = Backbone.Collection.extend({
  model: Periodization,
  parse: function (data) {
    if (_.isObject(data.periodizations)) {
      data.periodizations = _.values(data.periodizations);
    }
    return data;
  }
});
