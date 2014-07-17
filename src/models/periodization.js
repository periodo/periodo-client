"use strict";

var Backbone = require('../backbone')
  , Period = require('../models/period')
  , PeriodCollection = require('../collections/period')
  , Source = require('../models/source')

module.exports = Backbone.RelationalModel.extend({
  relations: [
    {
      type: Backbone.HasMany,
      key: 'definitions',
      relatedModel: Period,
      collectionType: PeriodCollection,
      //reverseRelation: { key: 'periodization' },
      parse: true
    },
    {
      type: Backbone.HasOne,
      key: 'source',
      relatedModel: Source,
      //reverseRelation: { key: 'periodization' },
      parse: true
    }
  ]
});
