"use strict";

var _ = require('underscore')
  , Dexie = require('dexie')

module.exports =  function() {
  var backends = {}
    , webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')

  backends = _.extend(backends, webDBs);

  return Dexie.getDatabaseNames().then(function (dexieDBs) {
    dexieDBs.forEach(function (db) {
      backends[db] = {
        type: 'idb',
        name: db,
        editable: true
      }
    });

    delete backends.web;
    if (window.location.protocol.indexOf('http') !== -1) {
      backends.web = {
        type: 'web',
        name: 'web',
        url: window.location.origin + window.location.pathname,
        editable: false
      }
    }
    return backends;
  });
}
