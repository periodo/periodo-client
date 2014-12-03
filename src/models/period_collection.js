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
    function hasYear(terminus) {
      return terminus.has('year') || terminus.has('earliestYear') || terminus.has('latestYear');
    }

    var starts = this.get('definitions')
      .map(function (period) { return period.get('start') })
      .filter(hasYear)

    var stops = this.get('definitions')
      .map(function (period) { return period.get('stop') })
      .filter(hasYear)

    function intYear(min, terminus) {
      var year = terminus.get('year') || terminus.get(min ? 'earliestYear' : 'latestYear');
      return parseInt(year, 10)
    }

    return {
      lower: starts.length ? _.min(starts, intYear.bind(null, true)) : undefined,
      upper: stops.length ? _.max(stops, intYear.bind(null, false)) : undefined
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
