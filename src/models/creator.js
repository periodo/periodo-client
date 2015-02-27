"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.RelationalModel.extend({
  fake: false,
  toJSON: function () {
    var ret = Backbone.RelationalModel.prototype.toJSON.apply(this, arguments);
    for (var key in ret) {
      if (!ret[key] || !(ret[key]).length) {
        delete ret[key];
      }
    }
    return ret;
  }
});
