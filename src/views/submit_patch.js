"use strict";

var TEMP_URL = 'http://localhost:5000/'

var $ = require('jquery')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/submit_patch.html');
    this.$el.html(template());

    var dataset = $.get(TEMP_URL + 'dataset/').then(function (dataset) {
      console.log(dataset);
    });
  }
});
