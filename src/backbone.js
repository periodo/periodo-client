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
  var storeName = object.storeName || object.model.prototype.storeName;

  if (!storeName) throw 'Define object store name to save.'

  return dbWrapper[method].call(dbWrapper, object, options);
}

function DatabaseWrapper(db) {
  this.db = db;
}

DatabaseWrapper.prototype = {
  create: function (object, options) {
    var table = this.db.table(object.storeName)
      , data

    if (object.isNew()) object.set(object.idAttribute, genid());

    data = object.toJSON();

    return this.db.transaction('rw', table.getAllRelatedTables(), function () {
      table.putModel(data);
    }).then(
      function () {
        if (options.success) options.success(data);
        return data;
      },
      function (err) {
        console.log(err);
        if (options.error) options.error(err);
        return err;
      }
    );
  },
  read: function (object, options) {
    var table
      , promise

    if (object instanceof Backbone.Model) {
      table = this.db.table(object.storeName);
      promise = this.db.transaction('r', table.getAllRelatedTables(), function () {
        return table.getModel(object.id);
      })
    } else {
      table = this.db.table(object.model.prototype.storeName);
      promise = this.db.transaction('r', table.getAllRelatedTables(), function () {
        return table.getAllModels();
      });
    }

    return promise.then(
      function (data) {
        if (options.success) options.success(data);
        return data;
      },
      function (err) {
        console.error(err);
        if (options.error) options.error(err);
        return err;
      }
    );
  },
  update: function () {
  },
  'delete': function () {
  },
  clear: function () {
  }
}
