"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , Backbone = require('backbone')
  , Dexie = require('Dexie')
  , genid = require('./utils/generate_skolem_id')
  , masterCollection

module.exports = Backbone;

Backbone.$ = $;
require('backbone.stickit');
require('backbone-relational');

Backbone.ajaxSync = Backbone.sync;

Backbone.sync = function (method, object, options) {
  var db = require('./db')
    , PeriodizationCollection = require('./collections/periodization')
    , promise

  if (!masterCollection) {
    promise = db.localData.orderBy('modified').last().then(function (data) {
      masterCollection = new PeriodizationCollection(data ? data.data : null, { parse: true });
      return masterCollection;
    }, console.error)
  } else {
    promise = Dexie.Promise.resolve(masterCollection);
  }

  promise = promise.then(function () {
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
      var localData = masterCollection.toJSON()
        , newData = _.extend(localData, object.toJSON())

      db.localData.put({
        data: newData,
        modified: new Date().getTime()
      });

      Backbone.Relational.store.reset();
      masterCollection = masterCollection.set(newData, { parse: true });

      return Dexie.Promise.resolve(newData);
    } else {
      if (method === 'create' && object.isNew()) object.set('id', genid());

      if (object instanceof PeriodizationCollection.prototype.model && method === 'create') {
        masterCollection.add(object);
      }

      db.localData.put({
        data: masterCollection.toJSON(),
        modified: new Date().getTime()
      })
      return Dexie.Promise.resolve(object.toJSON());
    }
  }).then(
    function (resp) {
      if (Backbone._app) Backbone._app.trigger('sync', object, resp);
      if (options && options.success) options.success(resp);
      return resp;
    },
    function (err) {
      console.error(err.stack || err);
      if (Backbone._app) Backbone._app.trigger('error', object, resp);
      if (options && options.error) options.error(err);
      return err;
    }
  );

  if (Backbone._app) Backbone._app.trigger('request', object, promise, options);
  object && object.trigger('request', object, promise, options);

  return promise;
}
