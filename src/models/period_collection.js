"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Period = require('../models/period')
  , PeriodCollection = require('../collections/period')
  , Source = require('../models/source')

module.exports = Backbone.RelationalModel.extend({
  skolemID: true,
  relations: [
    {
      type: Backbone.HasMany,
      key: 'definitions',
      relatedModel: Period,
      collectionType: PeriodCollection
    },
    {
      type: Backbone.HasOne,
      key: 'source',
      relatedModel: Source
    }
  ],
  parse: function (data) {
    if (_.isObject(data.definitions)) {
      data.definitions = _.values(data.definitions);
    }
    return data;
  },
  getTimespan: function () {
    var starts = this.get('definitions')
      .map(function (period) { return period.get('start') })
      .filter(function (t) { return t.hasYearData() })

    var stops = this.get('definitions')
      .map(function (period) { return period.get('stop') })
      .filter(function (t) { return t.hasYearData() })

    function intYear(min, terminus) {
      var year = terminus.get('year') || terminus.get(min ? 'earliestYear' : 'latestYear');
      return parseInt(year, 10)
    }

    return {
      lower: starts.length ? _.min(starts, function (t) { return t.getEarliestYear() }) : undefined,
      upper: starts.length ? _.max(stops, function (t) { return t.getLatestYear() }) : undefined,
    }
  },
  toJSON: function () {
    // change to structure of dataset
    var ret = Backbone.RelationalModel.prototype.toJSON.call(this);
    ret.definitions = ret.definitions.reduce(function (acc, period) {
      acc[period.id] = period;
      return acc;
    }, {});
    return ret;
  }
});
