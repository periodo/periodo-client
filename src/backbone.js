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
    var table = this.db.table(object.storeName)
      , data

    if (object.isNew()) object.set(object.idAttribute, genid());

    data = object.toJSON();

    return this.db.transaction('rw', table.getAllRelatedTables(), function () {
      table(object.storeName).putModel(data);
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
      var table = this.db.table(object.storeName);

      return this.db.transaction('r', table.getAllRelatedTables(), function () {
        return table.getModel(object.id);
      }).then(
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
