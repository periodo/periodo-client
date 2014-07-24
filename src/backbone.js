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
  var promise;

  if (!storeName) throw 'Define object store name to save.'

  promise = dbWrapper[method]
    .call(dbWrapper, object, options)
    .then(
      function (resp) {
        if (Backbone._app) Backbone._app.trigger('sync', object, resp);
        if (options.success) options.success(resp);
        return resp;
      },
      function (err) {
        console.error(err);
        if (Backbone._app) Backbone._app.trigger('error', object, err);
        if (options.error) options.error(err);
        return err;
      }
    );

  if (Backbone._app) Backbone._app.trigger('request', object, promise, options);
  object.trigger('request', object, promise, options);

  return promise;
}

function DatabaseWrapper(db) {
  this.db = db;
}

DatabaseWrapper.prototype = {
  create: function (object, options) {
    var table = this.db.table(object.storeName)

    if (object.isNew()) object.set(object.idAttribute, genid());

    return this.db.transaction('rw', table.getAllRelatedTables(), function () {
      return table.putModel(object.toJSON());
    });
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

    return promise;
  },
  update: function (object, options) {
    var that = this
      , table = this.db.table(object.storeName)

    return this.read(object).then(function (existingData) {
      that.db.transaction('rw', table.getAllRelatedTables(), function () {
        return table.updateModel(object.toJSON(), existingData);
      });
    });
  },
  'delete': function () {
  },
  clear: function () {
  }
}
