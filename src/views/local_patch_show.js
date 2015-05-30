"use strict";

var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  initialize: function ({ patch }) {
    this.patch = patch;
    this.render();
  },
  render: function () {
    this.$el.html(this.patch.html);
    this.$el.append(`<pre>${JSON.stringify(this.patch.data, false, '  ')}</pre>`);
  }
});
