"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , genid = require('./utils/generate_skolem_id')
  , getMasterCollection = require('./master_collection')

module.exports = function sync(method, object, options) {
   var PeriodizationCollection = require('./collections/period_collection')
    , message = options && options.message
    , promise
    , db

  promise = getMasterCollection().then(function (masterCollection) {
    if (method === 'read') {
      if (object instanceof Backbone.Model) {
        // Use backbone-relational to find this object
        // TODO: Fix if it doesn't exist
        return object.constructor.all().get({ id: object.id }).toJSON();
      } else {
        if (object instanceof PeriodizationCollection) {
          // Return full collection.
          // TODO: allow filtering, limiting, etc.
          return masterCollection.toJSON();
        }
        // TODO THIS IS BROKEN
        /*
        var collection = _.findWhere(Backbone.Relational.store._collections, {
          model: object.model
        })
        return collection && collection.toJSON();
        */
      }
    } else if (method === 'put' && object instanceof PeriodizationCollection) {
      db = require('./db');
      // Merging a collection of periodCollections, as in a merge during sync
      var localData = masterCollection.toJSON()
        , newData = _.extend(localData, object.toJSON())

      return db.updateLocalData(newData, message).then(function () {
        // TODO Fix reset logic for Supermodel
        // Backbone.Relational.store.reset();
        masterCollection.set(newData, { parse: true });
      });
    } else {
      db = require('./db');

      if (method === 'create' && object.isNew()) object.set('id', genid());

      if (object instanceof PeriodizationCollection.prototype.model && method === 'create') {
        masterCollection.add(object);
      }

      return db.updateLocalData(masterCollection.toJSON(), message).then(function () {
        return object.toJSON();
      });
    }
  }).then(
    function (resp) {
      if (Backbone._app) Backbone._app.trigger('sync', object, resp);
      if (options && options.success) options.success(resp);
      return resp;
    },
    function (err) {
      global.console.error(err.stack || err);
      if (Backbone._app) Backbone._app.trigger('error', object, err);
      if (options && options.error) options.error(err);
      return err;
    }
  );

  if (Backbone._app) Backbone._app.trigger('request', object, promise, options);
  if (object) object.trigger('request', object, promise, options);

  return promise;
}
