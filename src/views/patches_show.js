"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  initialize: function (opts) {
    this.patches = opts.data;
  },
  render: function () {
  }
})
