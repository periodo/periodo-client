"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , genid = require('./utils/generate_skolem_id')
  , getMasterCollection = require('./master_collection')

module.exports = function sync(method, object, options) {
   var PeriodizationCollection = require('./collections/period_collection')
     , Periodization = require('./models/period_collection')
     , message = options && options.message
     , promise
     , db

  promise = getMasterCollection().then(function (masterCollection) {

    if (method === 'read') {
      if (object instanceof Backbone.Model) {
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
    } else {
      // Not reading, so these are methods with side effects. Raise an error if
      // not using an editable data source.
      if (!masterCollection.periodo.editable) {
        throw new Error('Current data source is not editable. ' +
                        'Could not perform sync action "' + method + '".');
      }

      db = require('./db')(masterCollection.periodo.name);

      if (object instanceof PeriodizationCollection) {
        // This is a sync operation
        if (method === 'put') {
          // Merging a collection of periodCollections, as in a merge during sync
          var localData = masterCollection.toJSON()
            , newData = _.extend(localData, object.toJSON())

          return db.updateLocalData(newData, message).then(function () {
            // TODO Fix reset logic for Supermodel
            // Backbone.Relational.store.reset();
            masterCollection.set(newData, { parse: true });
          });
        }

        throw new Error('Method "' + method + '" is not valid for PeriodizationCollection objects.');
      } 

      if (object instanceof Periodization) {
        // Saving a PeriodCollection

        if (['create', 'update', 'delete'].indexOf(method) === -1) {
          throw new Error('Method "' + method + '" is not valid for PeriodCollection objects.');
        }

        // Set a skolem ID for new PeriodCollection objects
        if (method === 'create' && object.isNew()) {
          object.set('id', genid());
        }

        if (method === 'create') {
          masterCollection.add(object);
        }

        if (method === 'delete') {
          masterCollection.remove(object);
        }

        return db.updateLocalData(masterCollection.toJSON(), message).then(function () {
          return (method === 'create' || method === 'update') ? object.toJSON() : null;
        });
      }
    }

    throw new Error('Could not perform sync action "' + method + '" with given object.');
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
  ).catch(function (err) {
    global.console.error(err.stack);
  });

  if (Backbone._app) Backbone._app.trigger('request', object, promise, options);
  if (object) object.trigger('request', object, promise, options);

  return promise;
}
