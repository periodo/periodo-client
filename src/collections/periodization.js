"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Periodization = require('../models/periodization')

module.exports = Backbone.Collection.extend({
  model: Periodization,
  parse: function (data) {
    var periodizations;

    if (_.isObject(data.periodizations)) {
      periodizations = _.values(data.periodizations);
    }

    if (data['@context']) {
      this.context = data['@context']
    }

    return periodizations;
  },
  comparator: function (periodization) {
    var timespan = periodization.getTimespan();
    return timespan && timespan.lower && parseInt(timespan.lower.get('year'), 10);
  },
  toJSON: function () {
    var ret = Backbone.Collection.prototype.toJSON.call(this).reduce(function (acc, period) {
      acc.periodizations[period.id] = period;
      return acc;
    }, { periodizations: {} });

    if (this.context) {
      ret['@context'] = this.context;
    }

    return ret;
  }
});
