"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/index.html')
      , listTemplate = require('../templates/periodization_list.html')

    this.$el.html(template());
    this.$('#periodization-list').html(listTemplate({ periodizations: this.collection }));
  }
});
