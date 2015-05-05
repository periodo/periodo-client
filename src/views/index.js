"use strict";

var Backbone = require('../backbone')
  , Tablesort = require('tablesort')
  , backends = require('../backends')

module.exports = Backbone.View.extend({
  events: {
    'click #js-delete-database': 'deleteDatabase'
  },
  initialize: function (opts) {
    opts = opts || {};
    this.backend = opts.backend || backends.current();
    this.render();
  },
  render: function () {
    var template = require('../templates/index.html')
      , listTemplate = require('../templates/period_collection_list.html')
      , sourceHelpers = require('../helpers/source')

    //this.collection.sort();

    var periodCollections = this.collection
      .get('data')
      .get('periodCollections')
      .valueSeq()
      .map(require('../helpers/collection').describe)
      .toJS()

    this.$el.html(template({ backend: this.backend }));
    this.$('#periodization-list').html(listTemplate({
      periodCollections: periodCollections,
      backend: this.backend
    }));


    var table = this.$('#periodization-list table')[0];
    new Tablesort(table);
  },
  deleteDatabase: function () {
    backends.destroy(this.backend.name)
      .then(() =>  Backbone.history.navigate('#p/', { trigger: true }))
      .catch(err => console.error(err));
  }
});
