"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , Dexie = require('Dexie')
  , genid = require('./utils/generate_skolem_id')
  , masterCollection

// Get master Periodization collection
// Returns a promise.
function getMasterCollection() {
  var db = require('./db')
    , PeriodizationCollection = require('./collections/periodization')
    , promise

  if (!masterCollection) {
    promise = db.getLocalData().then(function (localData) {
      var periodizations = _.isEmpty(localData.data.periodizations) ? null : localData.data;
      masterCollection = new PeriodizationCollection(periodizations, { parse: true });
      return masterCollection;
    }, global.console.error)
  } else {
    promise = Dexie.Promise.resolve(masterCollection);
  }
  return promise;
}

module.exports = function sync(method, object, options) {
  var db = require('./db')
    , PeriodizationCollection = require('./collections/periodization')
    , message = options && options.message
    , promise

  promise = getMasterCollection().then(function () {
    if (method === 'read') {
      if (object instanceof Backbone.Model) {
        return Dexie.Promise.resolve(object.constructor.find(object.id).toJSON());
      } else {
        if (object instanceof PeriodizationCollection) {
          return Dexie.Promise.resolve(masterCollection.toJSON());
        }
        var collection = _.findWhere(Backbone.Relational.store._collections, {
          model: object.model
        })
        return Dexie.Promise.resolve(collection && collection.toJSON());
      }
    } else if (method === 'put' && object instanceof PeriodizationCollection) {
      // Merging a collection of periodizations, as in a merge during sync
      var localData = masterCollection.toJSON()
        , newData = _.extend(localData, object.toJSON())

      return db.updateLocalData(newData, message).then(function () {
        Backbone.Relational.store.reset();
        masterCollection.set(newData, { parse: true });
      });
    } else {
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
