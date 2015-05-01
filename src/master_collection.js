"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , Backbone = require('backbone')
  , masterCollection
  , currentBackend

module.exports = getMasterCollection

function reset() {
  function resetModel(model) {
    model.all().reset([]);
  }
  resetModel(require('./models/creator'));
  resetModel(require('./models/source'));
  resetModel(require('./models/spatial_item'));
  resetModel(require('./models/period_terminus'));
  resetModel(require('./models/period'));
  resetModel(require('./models/period_collection'));
}

function getIDBData(dbName) {
  var db = require('./db')(dbName);
  return db.getLocalData().then(function (localData) {
    return {
      data: localData.data,
      modified: localData.modified,
    }
  });
}

function getWebData(siteURL) {
  return new Promise(function (resolve, reject) {
    $.getJSON(siteURL + 'd/').then(function (data, status, xhr) {
      var modified = xhr.getResponseHeader('Last-Modified');
      resolve({
        data: data,
        modified: modified && new Date(modified).getTime(),
      })
    }, reject);
  });
}

// Get master Periodization collection
// Returns a promise.
function getMasterCollection(backendName) {
  var PeriodizationCollection = require('./collections/period_collection')
    , getBackends = require('./backends')
    , promise
    , backend

  if (!backendName) backendName = currentBackend;

  // If switching backends, or if there's no collection at all, get master collection
  if (backendName !== currentBackend || !masterCollection) {
    promise = getBackends().then(function (backends) {
      var masterCollectionPromise;

      backend = backends[backendName];


      if (!backend) throw new Error('No backend with name: ' + backendName);

      /*
      if (currentBackend) {
        Backbone._app.trigger('backendReset');
        reset();
      }
      */

      reset();

      if (backend.type === 'web') {
        masterCollectionPromise = getWebData(backend.url);
      } else if (backend.type === 'idb') {
        masterCollectionPromise = getIDBData(backend.name);
      } else {
        // TODO add "scratch" type
        throw new Error('Invalid backend type: "' + backend.type + '"');
      }

      masterCollectionPromise = masterCollectionPromise.then(function (ret) {
        ret.backend = backend;
        return ret;
      });

      return masterCollectionPromise.then(function (obj) {
        var periodCollections = _.isEmpty(obj.data.periodCollections || {}) ? null : obj.data;
        masterCollection = new PeriodizationCollection(periodCollections, { parse: true });

        masterCollection.periodo = {};
        for (var key in obj) {
          if (key === 'data' || !obj.hasOwnProperty(key)) continue;
          masterCollection.periodo[key] = obj[key];
        }

        localStorage.currentBackend = currentBackend = obj.backend.name;
        Backbone._app.trigger('backendSwitch', obj.backend);

        return masterCollection;
      });
    });
  } else {
    promise = Promise.resolve(masterCollection);
  }

  return promise;
}
