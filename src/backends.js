"use strict";

var _ = require('underscore')
  , Dexie = require('dexie')
  , Immutable = require('immutable')
  , errors = require('./errors')
  , current

const MEMORY_BACKEND = '__memory__'



/************************************************************
 * Main backend constructor
 ***********************************************************/

// Backends must implement a `fetchData` method which takes no arguments and
// returns an object with two keys: `data` (the PeriodO dataset), and
// `modified` (a Date object with the last modification date.
//
// If a backend is editable, it must also implement a `saveData` method that
// takes an Immutable object representing a new dataset as an argument and
// returns the saved immutable store.

function Backend(opts) {
  this.name = opts.name;
  this.type = opts.type;
  this.path = 'p/' + this.name + '/';
  this._data = null;
}

Backend.prototype = {
  get editable() { return !!this.saveData },
  saveStore: function (newData) {
    var app = require('./app')

    if (!this.saveData) {
      throw new Error(`Cannot save data for backend type ${this.type}`);
    }

    if (newData.equals(this._data)) return Promise.resolve(this._data);

    app.trigger('request');
    return this.saveData(newData)
      .then(saved => {
        app.trigger('requestEnd');
        return (this._data = saved instanceof Immutable.Iterable ? saved : Immutable.fromJS(saved));
      })
      .catch(require('./app').handleError)
  },
  getStore: function () {
    var app = require('./app')
      , promise

    if (!this.fetchData) {
      throw new Error(`Cannot fetch data for backend type ${this.type}`);
    }

    app.trigger('request');

    if (!this._data) {
      promise = this.fetchData().then(fetched => {
        this._data = Immutable.fromJS(fetched.data);
        this._modified = fetched.modified;
        return this._data;
      });
    } else {
      promise = Promise.resolve(this._data);
    }

    promise.then(() => app.trigger('requestEnd'));
    promise.then(() => setCurrentBackend(this));

    promise = promise.catch(app.handleError);

    return promise;
  }
}



/************************************************************
 * IndexedDB backend
 ***********************************************************/

function IDBBackend(opts) {
  Backend.call(this, opts);
  this.type = 'idb';

  this.fetchData = function () {
    return require('./db')(this.name).getLocalData()
      .then(function (localData) {
        return {
          data: localData.data,
          modified: localData.modified,
        }
      });
  }

  this.saveData = function (data) {
    return require('./db')(this.name).updateLocalData(data.toJS())
  }
}

IDBBackend.constructor = IDBBackend;
IDBBackend.prototype = Object.create(Backend.prototype);



/************************************************************
 * Web backend
 ***********************************************************/

function WebBackend(opts) {
  Backend.call(this, opts);
  this.type = 'web';

  this.url = this.name === 'web' ?
    window.location.origin + window.location.pathname :
    opts.url;

  this.fetchData = function () {
    return require('./ajax').getJSON(this.url + 'd/')
      .then(function ([data, status, xhr]) {
        var modified = xhr.getResponseHeader('Last-Modified');
        modified = modified && new Date(modified).getTime();
        return { data, modified };
      });
  }
}
WebBackend.constructor = WebBackend;
WebBackend.prototype = Object.create(Backend.prototype);



/************************************************************
 * In-memory backend
 ***********************************************************/

function MemoryBackend(opts) {
  Backend.call(this, opts);
  this.type = 'memory';
  this._patches = [];

  this.fetchData = function () {
    return Promise.resolve({
      data: {periodCollections: {}},
      modified: new Date().getTime()
    });
  }

  this.saveData =  function (newStore) {
    var { formatPatch } = require('./utils/patch')

    return this.getStore().then(oldStore => {
      var patch = formatPatch(oldStore.toJS(), newStore.toJS());
      this._patches.push(patch);
      this._data = newStore;
      return newStore;
    });
  }
}
MemoryBackend.constructor = MemoryBackend;
MemoryBackend.prototype = Object.create(Backend.prototype);



/************************************************************
 * Helper functions
 ***********************************************************/

function clientSupportsDexie() {
  var dependencies = Dexie.dependencies;
  return Object.keys(dependencies).every(k => dependencies[k]);
}


function listBackends() {
  var webDBs = JSON.parse((localStorage || {}).WebDatabaseNames || '{}')
    , dbPromise

  if (clientSupportsDexie()) {
    dbPromise = Dexie.getDatabaseNames().then(dexieDBs => {
      return dexieDBs.map(db => ({ type: 'idb', name: db }))
    });
  } else {
    dbPromise = Promise.resolve([]);
  }

  return dbPromise.then(function (dbs) {
    var backends = _.extend({}, webDBs)

    dbs.forEach(db => backends[db.name] = db);

    if (window && window.location.protocol.indexOf('http') !== -1) {
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
  if (current && current.name === name) {
    return Promise.resolve(current);
  } else if (name === MEMORY_BACKEND) {
    return Promise.resolve(new MemoryBackend({ name: MEMORY_BACKEND, type: 'memory' }));
  } else {
    return listBackends().then(backends => {
      var backendOpts = backends[name]
        , constructors
        , BackendConstructor

      constructors = {
        idb: IDBBackend,
        web: WebBackend,
        memory: MemoryBackend
      }

      if (!backendOpts) {
        throw new errors.NotFoundError(`Backend ${name} does not exist`);
      }

      BackendConstructor = constructors[backendOpts.type];

      return new BackendConstructor(backendOpts);
    });
  }
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
      var db
        , dbOpen

      if (opts.type === 'idb') {
        db = require('./db')(opts.name);
        dbOpen = new Promise(resolve => db.on('ready', resolve));
      } else if (opts.type === 'web') {
        let webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')
        webDBs[opts.name] = opts;
        localStorage.WebDatabaseNames = JSON.stringify(webDBs);
      } else {
        throw new Error(`Invalid backend type: ${opts.type}`);
      }

      return Promise
        .resolve(dbOpen)
        .then(() => getBackend(opts.name));
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
