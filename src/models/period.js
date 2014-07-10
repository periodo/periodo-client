"use strict";

var Backbone = require('../backbone')

/*
 *  Period
 * ========
 * The core PeriodO period data type.
 *
 */

module.exports = Backbone.Model.extend({
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
    source: {
      required: true
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
  },
  toJSONLD: function () {

  }
});
