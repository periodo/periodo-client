"use strict";

var _ = require('underscore')
  , dateParser = require('../utils/date_parser')
  , Supermodel = require('supermodel')

module.exports = Supermodel.Model.extend({
  getEarliestYear: function () {
    var inRange = this.attributes.in || {}
      , year

    if (inRange.hasOwnProperty('year')) {
      year = inRange.year;
    } else if (inRange.hasOwnProperty('earliestYear')) {
      year = inRange.earliestYear;
    } else if (this.get('label').toLowerCase() === 'present') {
      year = '' + (new Date().getFullYear());
    }

    return year ? parseInt(year, 10) : null;
  },
  getLatestYear: function () {
    var inRange = this.attributes.in || {}
      , year

    if (inRange.hasOwnProperty('year')) {
      year = inRange.year;
    } else if (inRange.hasOwnProperty('latestYear')) {
      year = inRange.latestYear;
    } else if (this.get('label').toLowerCase() === 'present') {
      year = '' + (new Date().getFullYear());
    }

    return year ? parseInt(year, 10) : null;
  },
  isRange: function () {
    var inRange = this.attributes.in || {};
    return inRange.hasOwnProperty('earliestYear') || inRange.hasOwnProperty('latestYear');
  },
  hasYearData: function () {
    var inRange = this.attributes.in || {};
    return inRange.hasOwnProperty('year') ||
      this.isRange ||
      this.get('label').toLowerCase() === 'present';
  },
  isGeneratedFromParser: function () {
    var label = this.get('label'), parsed;

    if (!label) return false;

    try {
      parsed = dateParser.parse(label);
      delete parsed._type;
    } catch (e) {
      return false;
    }

    return _.isEqual(parsed, this.toJSON());
  },
  toJSON: function () {
    var ret = { label: this.get('label'), 'in': {} }
      , inRange = this.attributes.in || {}

    if (inRange.hasOwnProperty('year')) {
      ret.in.year = inRange.year;
    } else {
      if (inRange.hasOwnProperty('earliestYear')) ret.in.earliestYear = inRange.earliestYear;
      if (inRange.hasOwnProperty('latestYear')) ret.in.latestYear = inRange.latestYear;
    }

    if (_.isEmpty(ret.in)) {
      delete ret.in;
    }

    return ret;
  }
});
