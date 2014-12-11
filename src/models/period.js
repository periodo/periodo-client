"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , SpatialCoverage = require('./spatial_item')
  , SpatialCoverageCollection = require('../collections/spatial_coverage')
  , PeriodTerminus = require('./period_terminus')

module.exports = Backbone.RelationalModel.extend({
  skolemID: true,
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
  ],
  validate: function (attrs) {
    var errors = {}
      , hasStart = attrs.start && attrs.start.get('label') && attrs.start.hasYearData()
      , hasStop = attrs.stop && attrs.stop.get('label') && attrs.stop.hasYearData()

    function addError(label, err) { errors[label] = (errors[label] || []).concat(err) }

    if (hasStart && hasStop) {
      if (attrs.stop.getLatestYear() < attrs.start.getEarliestYear()) {
        addError('dates', 'A period\'s end must come after its start.')
      }
    } else {
      addError('dates', 'A period must have a stop and start date.')
    }

    if (! (attrs.label && attrs.label.length) ) {
      addError('label', 'This field is required.');
    }

    return _.isEmpty(errors) ? null : errors;
  },
  toJSON: function () {
    var ret = Backbone.RelationalModel.prototype.toJSON.call(this);
    delete ret.dateType;
    return ret;
  }
});
