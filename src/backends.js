"use strict";

var _ = require('underscore')

module.exports =  function() {
  var backends = {}
    , dexieDBs = JSON.parse(localStorage['Dexie.DatabaseNames'] || '[]')
    , webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')

  dexieDBs.forEach(function (db) {
    backends[db] = {
      type: 'idb',
      name: db,
      editable: true
    }
  });

  backends = _.extend(backends, webDBs);

  delete backends.web;
  if (window.location.protocol.indexOf('http') !== -1) {
    backends.web = {
      type: 'web',
      name: 'web',
      httpLocation: window.location.origin + window.location.pathname,
      editable: false
    }
  }
  return backends;
}
