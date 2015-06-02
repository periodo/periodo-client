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

    React.render(
      <FacetBrowser dataset={this.store} />,
      this.$('#periodization-list').get(0)
    );
  },
  deleteDatabase: function () {
    backends.destroy(this.backend.name)
      .then(() =>  Backbone.history.navigate('#p/', { trigger: true }))
      .catch(err => console.error(err));
  }
});
