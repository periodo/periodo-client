"use strict";

var _ = require('underscore')
  , Dexie = require('Dexie')
  , masterCollection

module.exports = getMasterCollection

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

