"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  initialize: function (opts) {
    this.msg = (opts || {}).msg
    this.render();
  },
  render: function () {
    debugger;
    var template = require('../templates/not_found.html');
    this.$el.html(template({ msg: this.msg }));
  }
});
