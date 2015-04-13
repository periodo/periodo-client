"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , SpatialCoverage = require('./spatial_item')
  , SpatialCoverageCollection = require('../collections/spatial_coverage')
  , PeriodTerminus = require('./period_terminus')
  , Supermodel = require('supermodel')
  , Period

function isTrue(arg) { return !!arg }

Period = Supermodel.Model.extend({
  defaults: {
    start: {},
    stop: {},
    originalLabel: { 'eng-latn': [] },
    alternateLabel: { 'eng-latn': [] }
  },
  skolemID: true,
  validate: function (attrs) {
    var errors = {}
      , start = this.start()
      , stop = this.stop()
      , hasStart = start.get('label') && start.hasYearData()
      , hasStop = stop.get('label') && stop.hasYearData()

    function addError(label, err) { errors[label] = (errors[label] || []).concat(err) }

    if (hasStart && hasStop) {
      if (stop.getLatestYear() < start.getEarliestYear()) {
        addError('dates', 'A period\'s stop must come after its start.')
      }
    } else {
      addError('dates', 'A period must have start and stop dates.')
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
    if (this.spatialCoverage().length) {
      ret.spatialCoverage = this.spatialCoverage().map(function (coverage) {
        return coverage.toJSON();
      });
    }

    var alternateLabels = Object.keys(ret.alternateLabel).map(function (key) {
      return ret.alternateLabel[key].length > 0
    });


    if (!alternateLabels.some(isTrue)) {
      delete ret.alternateLabel;
    }

    ret.type = 'PeriodDefinition';

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
