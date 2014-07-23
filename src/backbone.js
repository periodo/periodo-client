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

  return dbWrapper[method].call(dbWrapper, object, options);
}

function DatabaseWrapper(db) {
  this.db = db;
}

DatabaseWrapper.prototype = {
  create: function (object, options) {
    var db = this.db // not sure about scope of transactions..
      , tables = db.getTablesForModel(object)
      , data

    if (object.isNew()) object.set(object.idAttribute, genid());

    data = object.toJSON();

    return db.transaction('rw', tables, function () {
      db.table(object.storeName).putModel(data);
    }).then(
      function () {
        if (options.success) options.success(data);
        return data;
      },
      function (err) {
        if (options.error) options.error(err);
        return err;
      }
    );
  },
  read: function (object, options) {
    if (object instanceof Backbone.Model) {
      return this.db[object.storeName].getModel(object.id).then(
        function (data) {
          if (options.success) options.success(data);
          return data;
        },
        function (err) {
          if (options.error) options.error(err);
          return err;
        }
      );
    } else {
      return this.db[object.storeName].getCollection(object.model.prototype.storeName);
    }
  },
  update: function () {
  },
  'delete': function () {
  },
  clear: function () {
  }
}
