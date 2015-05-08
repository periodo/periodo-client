"use strict";

var _ = require('underscore')
  , Dexie = require('dexie')
  , Immutable = require('immutable')
  , errors = require('./errors')
  , current


function fetchWebData(url) {
  var getJSON = require('./ajax').getJSON;
  return getJSON(url + 'd/')
    .then(function ([data, status, xhr]) {
      var modified = xhr.getResponseHeader('Last-Modified')
      modified = modified && new Date(modified).getTime()

      return { data, modified }
    });
}

function fetchIDBData(dbName) {
  return require('./db')(dbName).getLocalData()
    .then(function (localData) {
      return {
        data: localData.data,
        modified: localData.modified,
      }
    });
}

function Backend(opts) {
  this.name = opts.name;
  this.type = opts.type;
  this.path = 'p/' + this.name + '/';
  this._data = null;

  if (this.type === 'web') {
    this.url = this.name === 'web' ?
      window.location.origin + window.location.pathname :
      opts.url
  }

  this.editable = this.type === 'idb';
}

Backend.prototype = {
  fetchData: function () {
    if (this.type === 'web') {
      return fetchWebData(this.url);
    } else if (this.type === 'idb') {
      return fetchIDBData(this.name);
    }
  },
  getStore: function () {
    var app = require('./app')
      , promise

    app.trigger('request');
    if (!this._data) {
      promise = this.fetchData()
        .then(data => {
          var immutableData = Immutable.fromJS(data);
          this._data = immutableData;
          return immutableData;
        })
    } else {
      promise = Promise.resolve(this._data);
    }

    promise.then(
        () => app.trigger('requestEnd'),
        () => app.trigger('requestEnd'))
    promise.then(() => setCurrentBackend(this));

    return promise;
  }
}


function listBackends() {
  var backends = {}
    , webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')

  backends = _.extend(backends, webDBs);

  return Dexie.getDatabaseNames().then(function (dexieDBs) {
    dexieDBs.forEach(function (db) {
      backends[db] = {
        type: 'idb',
        name: db,
      }
    });

    delete backends.web;
    if (window.location.protocol.indexOf('http') !== -1) {
      backends.web = {
        type: 'web',
        name: 'web',
        url: window.location.origin + window.location.pathname,
      }
    }
    return backends;
  });
}

function getBackend(name) {
  return (current && current.name === name) ?
    Promise.resolve(current) :
    listBackends().then(backends => {
      var backend = backends[name];

      if (!backend) {
        throw new errors.NotFoundError(`Backend ${name} does not exist`);
      }

      return new Backend(backend);
    });
}

function setCurrentBackend(backend) {
  if (current !== backend) {
    require('./app').trigger('backendSwitch', backend);
    current = backend;
    localStorage.currentBackend = backend.name;
  }

  return current;
}

function addBackend(opts) {
  return listBackends()
    .then(backends => {
      if (backends.hasOwnProperty(opts.name)) {
        throw new Error(`There is already a backend with name: ${opts.name}`);
      }
    })
    .then(() => {
      if (opts.type === 'idb') {
        require('./db')(opts.name);
      } else if (opts.type === 'web') {
        let webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')
        webDBs[opts.name] = opts;
        localStorage.WebDatabaseNames = JSON.stringify(webDBs);
      } else {
        throw new Error(`Invalid backend type: ${opts.type}`);
      }

      return getBackend(opts.name);
    })
}

function deleteBackend(name) {
  return listBackends()
    .then(backends => {
      var toDelete = backends[name] || {}
        , promise

      if (toDelete.type === 'idb') {
        promise = require('./db')(name).delete();
      } else if (toDelete.type === 'web') {
        let webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')
        delete webDBs.name;
        localStorage.WebDatabaseNames = JSON.stringify(webDBs);
        promise = Dexie.Promise.resolve();
      }

      return promise;
    })
    .then(() => {
      if (localStorage.currentBackend === name) {
        delete localStorage.currentBackend;
      }
    });
}

module.exports = {
  get: getBackend,
  list: listBackends,

  create: addBackend,
  destroy: deleteBackend,

  current: function () {
    return current;
  },
  switchTo: function (name) {
    return getBackend(name).then(setCurrentBackend)
  }
}
