"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
    this.stickit();
  },
  events: {
  },
  bindings: {
  },
  render: function () {
    var template = require('../templates/source_form.html');
    this.$el.html(template());
  }
});
