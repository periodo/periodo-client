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
      .filter(function (terminus) { return terminus.get('year') })

    var stops = this.get('definitions')
      .map(function (period) { return period.get('stop') })
      .filter(function (terminus) { return terminus.get('year') })

    function intYear(terminus) { return parseInt(terminus.get('year'), 10) }

    return {
      lower: starts.length ? _.min(starts, intYear) : undefined,
      upper: stops.length ? _.max(stops, intYear) : undefined
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
