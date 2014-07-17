"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.RelationalModel.extend({
  dateTypes: [
    'bp2000', 'bp1950', 'gregorian', 'iso8601'
  ],
  validation: {
    label: { required: true },
    type: {
      required: true,
      fn: function (val) { return this.dateTypes.indexOf(val) === -1 }
    },
    gYear: {
      required: true,
      pattern: /[+\-]\d+/
    }
  }
});
