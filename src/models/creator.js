"use strict";

var Backbone = require('../backbone')
  , Supermodel = require('supermodel')

module.exports = Supermodel.Model.extend({
  toJSON: function () {
    var ret = Supermodel.Model.prototype.toJSON.apply(this, arguments);
    for (var key in ret) {
      if (!ret[key] || !(ret[key]).length) {
        delete ret[key];
      }
    }
    return ret;
  }
});
