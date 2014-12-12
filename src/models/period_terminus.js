"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , dateParser = require('../utils/date_parser')

module.exports = Backbone.RelationalModel.extend({
  parse: function (data) {
    var ret = {};
    ret.label = data.label;
    ret = _.extend(ret, data.in || {});
    return ret;
  },
  getEarliestYear: function () {
    var year;

    if (this.has('year')) {
      year = this.get('year');
    } else if (this.has('earliestYear')) {
      year = this.get('earliestYear');
    } else if (this.get('label').toLowerCase() === 'present') {
      year = '' + (new Date().getFullYear());
    }

    return year ? parseInt(year, 10) : null;
  },
  getLatestYear: function () {
    var year;

    if (this.has('year')) {
      year = this.get('year');
    } else if (this.has('latestYear')) {
      year = this.get('latestYear');
    } else if (this.get('label').toLowerCase() === 'present') {
      year = '' + (new Date().getFullYear());
    }

    return year ? parseInt(year, 10) : null;
  },
  isRange: function () {
    return this.has('earliestYear') || this.has('latestYear');
  },
  hasYearData: function () {
    return this.has('year') || this.isRange() || this.get('label').toLowerCase() === 'present';
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

    if (this.has('year')) {
      ret.in.year = this.get('year');
    } else {
      if (this.has('earliestYear')) ret.in.earliestYear = this.get('earliestYear');
      if (this.has('latestYear')) ret.in.latestYear = this.get('latestYear');
    }

    return ret;
  }
});
