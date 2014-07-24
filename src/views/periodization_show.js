"use strict";

var Backbone = require('../backbone')

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/periodization_show.html')
      , sourceTemplate = require('../templates/source.html')

    this.$el.html(template());
    this.$('#source-information').html(sourceTemplate({ source: this.model.toJSON().source }));
    this.$periodsList = this.$('#periods-list');

  }
});
