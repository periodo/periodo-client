"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')

module.exports = Backbone.RelationalModel.extend({
  dateTypes: [
    'bp2000', 'bp1950', 'gregorian', 'iso8601'
  ],
  validation: {
    label: { required: true },
    type: {
      required: false,
      fn: function (val) { return this.dateTypes.indexOf(val) === -1 }
    },
    year: {
      required: true,
      pattern: /[+\-]\d+/
    }
  },
  parse: function (data) {
    var ret = {};
    ret.label = data.label;
    ret = _.extend(ret, data.in || {});
    return ret;
  }
});
