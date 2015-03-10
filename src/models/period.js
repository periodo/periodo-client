"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , SpatialCoverage = require('./spatial_item')
  , SpatialCoverageCollection = require('../collections/spatial_coverage')
  , PeriodTerminus = require('./period_terminus')
  , Supermodel = require('supermodel')
  , Period

Period = Supermodel.Model.extend({
  skolemID: true,
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
    var ret = Supermodel.Model.prototype.toJSON.call(this);

    delete ret.dateType;
    delete ret.start_id;
    delete ret.stop_id;

    ret.start = this.start().toJSON();
    ret.stop = this.stop().toJSON();
    ret.spatialCoverage = this.spatialCoverage().map(function (coverage) {
      return coverage.toJSON();
    });

    return ret;
  }
});

Period.has().one('start', {
  model: PeriodTerminus,
  inverse: 'period',
  source: 'start'
});

Period.has().one('stop', {
  model: PeriodTerminus,
  inverse: 'period',
  source: 'stop'
});

Period.has().many('spatialCoverage', {
  collection: SpatialCoverageCollection,
  inverse: 'period',
  source: 'spatialCoverage'
});

module.exports = Period;
