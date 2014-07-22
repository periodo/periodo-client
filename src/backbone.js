"use strict";

var Backbone = require('backbone')
  , $ = require('jquery')
  , _ = require('underscore')
  , genid = require('./utils/generate_skolem_id')

module.exports = Backbone;

Backbone.$ = $;
require('backbone.stickit');
require('backbone-validation');
require('backbone-relational');


_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);
Backbone.ajaxSync = Backbone.sync;

Backbone.sync = function (method, object, options) {
  var db = require('./db');
  var dbWrapper = new DatabaseWrapper(db);
  var storeName = object.storeName;

  if (!storeName) throw 'Define object store name to save.'
  //if (!db.hasOwnProperty(storeName)) throw '' + storeName + ' is not an object store in IndexedDB.';
  
  return dbWrapper[method].call(dbWrapper, object, options);
}

function DatabaseWrapper(db) {
  this.db = db;
}

DatabaseWrapper.prototype = {
  create: function (object, options) {
    var db = this.db;
    var tables = db.getTablesForModel(object);

    if (object.isNew()) {
      object.set(object.idAttribute, genid());
    }

    return db.transaction('rw', tables, function () {
      var table = _(tables).findWhere({ name: object.storeName });
      table.putModel(object.toJSON());
    });
  },
  read: function (object, options) {
    return this.db[object.storeName].getModel(object.id).then(object.set.bind(object));
  },
  update: function (object, options) {
  },
  'delete': function (object, options) {
  },
  clear: function (object, options) {
  }
}
