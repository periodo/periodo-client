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
    var starts = this.get('definitions').map(function (period) { return period.get('start') });
    var stops = this.get('definitions').map(function (period) { return period.get('stop') });

    function intYear(terminus) { return parseInt(terminus.get('year'), 10) };

    return {
      lower: starts.length ? _(starts).min(intYear) : undefined,
      upper: stops.length ? _(stops).max(intYear) : undefined
    }
  }
});
