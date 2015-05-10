"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , db = require('./db')
  , genid = require('./utils/generate_skolem_id')

function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = function sync(method, object, options) {
  var PeriodizationCollection = require('./collections/period_collection')
    , Periodization = require('./models/period_collection')
    , backend = require('./backends').current()
    , message = options && options.message

  if (method === 'read') {
    throw new Error('Don\'t do this.');
  }

  if (!backend.editable) {
    throw new Error('Current data source is not editable. ' +
                    'Could not perform sync action "' + method + '".');
  }

  return backend.getMasterCollection()
    .then(masterCollection => {

      // Merging a collection of periodCollections, as in a merge during sync
      if (object instanceof PeriodizationCollection) {
        if (method === 'put') {
          let localData = masterCollection.toJSON()
            , newData = _.extend(copy(localData), object.toJSON())

          return db(backend.name).updateLocalData(newData, message)
            .then(() => masterCollection.set(newData, { parse: true }));
        }
      }

      // Saving a PeriodCollection
      if (object instanceof Periodization) {

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

        return db.updateLocalData(masterCollection.toJSON(), message)
          .then(function () {
            return (method === 'create' || method === 'update') ? object.toJSON() : null;
          });
      }

      throw new Error('Could not perform sync action "' + method + '" with given object.');
    })
    .then(function (resp)  {
      require('./app').trigger('sync', object, resp);
      if (options && options.success) options.success(resp);
      return resp;
    })
    .catch(function (err) {
      global.console.error(err.stack || err);
      require('./app').trigger('error', object, err);
      if (options && options.error) options.error(err);
      return err;
    });
}
