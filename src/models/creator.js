"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.RelationalModel.extend({
  fake: false
  /*
  toJSON: function () {
    var ret = Backbone.RelationalModel.prototype.toJSON.apply(this, arguments);
    if (!this.id) {
      ret[this.idAttribute] = genid();
    }
    return ret;
  }
  */
});
