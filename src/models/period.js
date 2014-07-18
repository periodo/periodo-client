"use strict";

var Backbone = require('../backbone')
  , SpatialCoverage = require('./spatial_item')
  , SpatialCoverageCollection = require('../collections/spatial_coverage')
  , PeriodTerminus = require('./period_terminus')

/*
 *  Period
 * ========
 * The core PeriodO period data type.
 *
 */

module.exports = Backbone.RelationalModel.extend({
  relations: [
    {
      type: Backbone.HasOne,
      key: 'start',
      relatedModel: PeriodTerminus,
      parse: true
    },
    {
      type: Backbone.HasOne,
      key: 'stop',
      relatedModel: PeriodTerminus,
      parse: true
    },
    {
      type: Backbone.HasMany,
      key: 'spatialCoverage',
      relatedModel: SpatialCoverage,
      collectionType: SpatialCoverageCollection
    }
  ]
});
