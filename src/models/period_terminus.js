"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')

module.exports = Backbone.RelationalModel.extend({
  parse: function (data) {
    var ret = {};
    ret.label = data.label;
    ret = _.extend(ret, data.in || {});
    return ret;
  },
  isRange: function () {
    return this.has('earliestYear') || this.has('latestYear');
  },
  toJSON: function () {
    var ret = { label: this.get('label'), 'in': {} }
      , earliest
      , latest

    if (this.has('year')) {
      ret.in.year = this.get('year');
    } else {
      earliest = this.get('earliestYear');
      latest = this.get('latestYear');
      if (earliest) ret.in.earliestYear = earliest;
      if (latest) ret.in.latestYear = latest;
    }

    return ret;
  }
});
