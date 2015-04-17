"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  initialize: function ({ localPatches }) {
    this.localPatches = localPatches;
    this.render();
  },
  render: function () {
    var template = require('../templates/local_patches.html');
    this.$el.html(template({ localPatches: this.localPatches }));
  }
});
