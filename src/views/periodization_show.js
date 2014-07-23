"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/periodization_show.html');
    this.$el.html(template({ periodization: this.model.toJSON() }));
  }
});
