"use strict";

var Backbone = require('../backbone')

/*
 *  Period
 * ========
 * The core PeriodO period data type.
 *
 */

module.exports = Backbone.Model.extend({
  defaults: {
    /*
    startDateSignificance: 5,
    endDateSignificance: 5
    */
  },
  dateTypes: [
    'bp2000', 'bp1950', 'gregorian', 'iso8601', 'julian'
  ],
  validation: {
    label: {
      required: true,
      maxLength: 80
    },
/*
    dateType: {
      required: true,
      fn: function (val, attr, state) {
        return this.dateTypes.indexOf(val) !== -1;
      }
    },
*/
    source: {
      required: true
    },
    startDate: {
      required: true,
      pattern: 'number'
    },
    endDate: {
      required: function (val, attr, state) {
        return state.startDate > 0;
      },
      fn: function (val, attr, state) {
        Backbone.Validation.validators.pattern(val, attr, 'number', this);
        if (parseInt(val) <= parseInt(state.startDate)) {
          return "Start date must come before end date."
        }
      },
      pattern: 'number'
    },
    /*
    startDateSignificance: {
      required: true,
      pattern: 'number'
    },
    endDateSignificance: {
      required: true,
      pattern: 'number'
    }
    */
  },
  toJSONLD: function () {

  }
});
