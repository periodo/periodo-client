"use strict";

var Backbone = require('../backbone')

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

    this.$el.html(template());
    this.$('#periodization-list').html(listTemplate({ periodCollections: this.collection }));
  },
  deleteDatabase: function () {
    var db = require('../db');
    db.delete().then(function () {
      window.location.reload(true);
    });
  }
});
