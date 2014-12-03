"use strict";

var _ = require('underscore')
  , Dexie = require('Dexie')
  , masterCollection

module.exports = getMasterCollection

// Get master Periodization collection
// Returns a promise.
function getMasterCollection() {
  var db = require('./db')
    , PeriodizationCollection = require('./collections/period_collection')
    , promise

  if (!masterCollection) {
    promise = db.getLocalData().then(function (localData) {
      var periodCollections = _.isEmpty(localData.data.periodCollections) ? null : localData.data;
      masterCollection = new PeriodizationCollection(periodCollections, { parse: true });
      return masterCollection;
    }, global.console.error)
  } else {
    promise = Dexie.Promise.resolve(masterCollection);
  }
  return promise;
}

