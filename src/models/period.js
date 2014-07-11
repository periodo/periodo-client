"use strict";

var Backbone = require('../backbone')
  , SpatialCoverageCollection = require('../collections/spatial_coverage')
  , stringify = require('json-stable-stringify')
  , stringifyOpts = {
    space: '  ',
    cmp: function (a, b) { return a.key > b.key ? 1 : -1; },
  }

/*
 *  Period
 * ========
 * The core PeriodO period data type.
 *
 */

module.exports = Backbone.Model.extend({
  initialize: function () {
    this.spatialCoverages = new SpatialCoverageCollection();
  },
  dateTypes: [
    'bp2000', 'bp1950', 'gregorian', 'iso8601', 'julian'
  ],
  validation: {
    label: {
      required: true,
      maxLength: 80
    },
    dateType: {
      required: true,
      fn: function (val, attr, state) {
        return this.dateTypes.indexOf(val) === -1;
      }
    },
    startDate: {
      required: true,
      pattern: /[+\-]\d+/
    },
    endDate: {
      required: true,
      fn: function (val, attr, state) {
        Backbone.Validation.validators.pattern(val, attr, 'number', this);
        if (parseInt(val) <= parseInt(state.startDate)) {
          return "End date must come after start date."
        }
      }
    },
    startDateLabel: {
      required: true
    },
    endDateLabel: {
      required: true
    }
  },
  toJSONLD: function () {
    var obj = {};

    obj.label = this.get('label');
    obj.localizedLabel = { en: this.get('label') };

    if (this.has('note')) {
      obj.note = this.get('note')
    }

    if (this.spatialCoverages.length) {
      obj.spatialCoverage = this.spatialCoverages.map(function (model) {
        return {
          '@id': model.get('@id'),
          'label': model.get('label')
        }
      });
    }

    obj.start = {
      label: this.get('startDateLabel'),
      type: this.get('dateType'),
      isoValue: this.get('startDate')
    }

    obj.stop = {
      label: this.get('endDateLabel'),
      type: this.get('dateType'),
      isoValue: this.get('endDate')
    }

    return stringify(obj, stringifyOpts);
  }
});
