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
  dateTypes: [
    'bp2000', 'bp1950', 'gregorian', 'iso8601'
  ],
  validate: function (attrs) {
    var errors = {}
      , hasStart = attrs.start && attrs.start.get('label') && attrs.start.get('year')
      , hasStop = attrs.stop && attrs.stop.get('label') && attrs.stop.get('label')

    function addError(label, err) { errors[label] = (errors[label] || []).concat(err) }

    if (hasStart && hasStop) {
      if ( parseInt(attrs.start.get('year'), 10) > parseInt(attrs.stop.get('year'), 10) ) {
        addError('dates', 'A period\'s end must come after its start.')
      }
    } else {
      addError('dates', 'A period must have a stop and start date.')
    }

    if (! (attrs.label && attrs.label.length) ) {
      addError('label', 'This field is required.');
    }

    return _.isEmpty(errors) ? null : errors;
  }
});
