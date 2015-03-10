"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Periodization = require('../models/period_collection')

module.exports = Backbone.Collection.extend({
  model: function (attrs, options) {
    return Periodization.create(attrs, options)
  },
  parse: function (data) {
    var periodCollections;

    if (_.isObject(data.periodCollections)) {
      periodCollections = _.values(data.periodCollections);
    }

    if (data['@context']) {
      this.context = data['@context']
    }

    return periodCollections;
  },
  comparator: function (periodCollection) {
    var timespan = periodCollection.getTimespan();
    return timespan && timespan.lower && parseInt(timespan.lower.get('year'), 10);
  },
  toJSON: function () {
    var ret = Backbone.Collection.prototype.toJSON.call(this).reduce(function (acc, period) {
      acc.periodCollections[period.id] = period;
      return acc;
    }, { periodCollections: {} });

    if (this.context) {
      ret['@context'] = this.context;
    }

    return ret;
  }
});
