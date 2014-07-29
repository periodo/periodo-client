"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Periodization = require('../models/periodization')

module.exports = Backbone.Collection.extend({
  model: Periodization,
  parse: function (data) {
    if (_.isObject(data.periodizations)) {
      data = _.values(data.periodizations);
    }
    return data;
  },
  comparator: function (periodization) {
    var timespan = periodization.getTimespan();
    return timespan && timespan.lower && parseInt(timespan.lower.get('year'), 10);
  }
});
