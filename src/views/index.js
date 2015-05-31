"use strict";

var Backbone = require('../backbone')
  , React = require('react')
  , backends = require('../backends')

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
    var template = require('../templates/index.html')
      , PeriodCollectionListComponent = require('./period_collection_list.jsx')
      , periodCollections

    periodCollections = this.store
      .get('periodCollections')
      .valueSeq()
      .map(require('../helpers/periodization').describe)
      .toJS()

    this.$el.html(template({ backend: this.backend }));

    React.render(
      <PeriodCollectionListComponent backend={this.backend} data={periodCollections} />,
      this.$('#periodization-list').get(0)
    );
  },
  deleteDatabase: function () {
    backends.destroy(this.backend.name)
      .then(() =>  Backbone.history.navigate('#p/', { trigger: true }))
      .catch(err => console.error(err));
  }
});
