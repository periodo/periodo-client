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
  toJSON: function () {
    return {
      label: this.get('label'),
      'in': {
        year: this.get('year')
      }
    }
  }
});
