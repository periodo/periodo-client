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
    return {
      lower: _(starts).min(function (t) { return parseInt(t.get('year'), 10) }),
      upper: _(stops).max(function (t) { return parseInt(t.get('year'), 10) })
    }
  }
});
