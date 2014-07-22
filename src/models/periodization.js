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
      collectionType: PeriodCollection,
    },
    {
      type: Backbone.HasOne,
      key: 'source',
      relatedModel: Source,
    }
  ],
  parse: function (data) {
    if (_.isObject(data.definitions)) {
      data.definitions = _.values(data.definitions);
    }
    return data;
  }
});
