"use strict";

var Backbone = require('backbone')
  , React = require('react')
  , backends = require('../../backends')

module.exports = Backbone.View.extend({
  events: {
    'click #js-delete-database': 'deleteDatabase'
  },
  initialize: function (opts) {
    opts = opts || {};
    this.backend = opts.backend || backends.current();
    this.store = opts.store;
    this.render();
  },
  render: function () {
    var template = require('../../templates/index.html')
      , FacetBrowser = require('./browser.jsx')
      , periods

    this.$el.html(template({ backend: this.backend }));
    this.listEl = this.$('#periodization-list').get(0);

    React.render(<FacetBrowser backend={this.backend} dataset={this.store} />, this.listEl);
  },
  remove: function () {
    React.unmountComponentAtNode(this.listEl);
    Backbone.View.prototype.remove.call(this);
  },
  deleteDatabase: function () {
    backends.destroy(this.backend.name)
      .then(() =>  Backbone.history.navigate('#p/', { trigger: true }))
      .catch(err => console.error(err));
  }
});
