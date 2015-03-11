"use strict";

var Backbone = require('../../backbone');

module.exports = Backbone.View.extend({
  bindings: {
    '#js-label': 'label',
    '#js-same-as': 'sameAs',
    '#js-locator': 'locator'
  },
  initialize: function () {
    this.render();
    this.stickit();
  },
  render: function () {
    var template = require('./templates/general_form.html');
    this.$el.html(template());
  }
});
