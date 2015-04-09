"use strict";

var Backbone = require('../backbone')
  , Tablesort = require('tablesort')

module.exports = Backbone.View.extend({
  events: {
    'click #js-delete-database': 'deleteDatabase'
  },
  initialize: function () {
    this.render();
  },
  render: function () {
    var template = require('../templates/index.html')
      , listTemplate = require('../templates/period_collection_list.html')

    this.collection.sort();

    this.$el.html(template({ backend: this.collection.periodo.backend }));
    this.$('#periodization-list').html(listTemplate({ periodCollections: this.collection }));


    var table = this.$('#periodization-list table')[0];
    new Tablesort(table);
  },
  deleteDatabase: function () {
    var db = require('../db')(localStorage.currentBackend);

    db.delete().then(function () {
      Backbone.history.navigate('#p/', { trigger: true });
    });
  }
});
