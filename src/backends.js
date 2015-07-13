"use strict";

var _ = require('underscore')
  , Dexie = require('dexie')
  , Immutable = require('immutable')
  , errors = require('./errors')
  , current

const MEMORY_BACKEND = '__memory__'
    , FILE_BACKEND = '__file__'



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
    if (!this.saveData) {
      throw new Error(`Cannot save data for backend type ${this.type}`);
    }

    if (newData.equals(this._data)) return Promise.resolve(this._data);

    window.periodo.emit('request');
    return this.saveData(newData)
      .then(saved => {
        window.periodo.emit('requestEnd');
        this._data = (
          saved instanceof Immutable.Iterable ?
            saved :
            Immutable.fromJS(saved))

        return this._data;
      })
      .catch(window.periodo.handleError)
  },
  getStore: function () {
    var promise

    if (!this.fetchData) {
      throw new Error(`Cannot fetch data for backend type ${this.type}`);
    }

    window.periodo.emit('request');

    if (!this._data) {
      promise = this.fetchData().then(fetched => {
        this._data = Immutable.fromJS(fetched.data);
        this._modified = fetched.modified;
        return this._data;
      });
    } else {
      promise = Promise.resolve(this._data);
    }

    promise.then(() => window.periodo.emit('requestEnd'));
    promise.then(() => setCurrentBackend(this));

    promise = promise.catch(window.periodo.addEror);

    return promise;
  },

  // `toRemote` is a boolean value that represents if the returned patches
  // should represent changes are meant to be applied to the remote dataset.
  getChanges: function(toRemote, remote, remoteURL) {
    var { makePatch } = require('./utils/patch')
      , { filterByHash } = require('./helpers/patch_collection')
      , { replaceIDs } = require('./helpers/skolem_ids')
      , periodCollectionRegex = /^\/periodCollection/
      , localStore
      , remoteStore


    if (!(this.editable && this.matchHashes)) {
      throw new Error(`Cannot get patches for backend with type ${this.type}`)
    }

    return this.getMappedIDs(remoteURL)
      .then(mappedIDs => replaceIDs(Immutable.fromJS(remote), mappedIDs))
      .then(remoteStore => Promise.all([this.getStore(), remoteStore]))
      .then(([_localStore, _remoteStore]) => {
        localStore = _localStore;
        remoteStore = _remoteStore;

        return toRemote ?
          // Patch submission (to server)
          makePatch(localStore.toJS(), remoteStore.toJS()) :

          // Sync (from server)
          makePatch(remoteStore.toJS(), localStore.toJS())
      })
      .then(patches => patches.filter(
        // Only deal with patches that deal with a period collection
        patch => patch.path.match(periodCollectionRegex))
      )
      .then(Immutable.fromJS)
      .then(patches => {
        // If we're trying to make "remote" look like local, *only include*
        // those patches that having matching forward patches stored in this
        // backend.

        // If we're trying to make "local" look like "remote", *exclude* all
        // patches that having matching backward patches in this backend.

        return filterByHash(
          patches,
          toRemote,
          this.matchHashes.bind(this, toRemote ? 'forward' : 'backward'))
      })
      .then(patches => ({
        patches,
        sourceStore: toRemote ? localStore : remoteStore,
        destStore: toRemote ? remoteStore : localStore
      }))
  },

  // Get the set of patches that would make "local" look like "remote", as in
  // downloading assertions from a server to a local client.
  getChangesFromRemote: function (remote, remoteURL) {
    return this.getChanges(true, remote, remoteURL)
  },


  // Get the set of patches that would make "remote" look like "local", as in
  // submitting some patches from the local client to a server.
  getChangesFromLocal: function (remote, remoteURL) {
    return this.getChanges(false, remote, remoteURL)
  },

  saveSubmittedPatch: function (data) {
    var { NotImplementedError } = require('./errors');
    throw new NotImplementedError(
      `saveSubmittedPatch not implemented for backend type ${this.type}`
    )
  },

  getSubmittedPatches: function () {
    throw new NotImplementedError(
      `getSubmittedPatches not implemented for backend type ${this.type}`
    )
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

  this.matchHashes = function (direction, hashes) {
    return require('./db')(this.name)
      .patches
      .where(direction + 'Hashes')
      .anyOf(hashes.toArray())
      .uniqueKeys()
  }

  this.saveSubmittedPatch = function (patchObj) {
    return require('./db')(this.name).localPatches
      .put(patchObj)
      .then(() => patchObj.id)
  }

  this.markSubmittedPatchMerged = function (localPatchID, serverPatchObj) {
    var db = require('./db')(this.name)
      , prefixMatch = require('./utils/prefix_match')
      , serverURL = prefixMatch(serverPatchObj.created_from, serverPatchObj.url)
      , identifiers

    identifiers = Object.keys(serverPatchObj.identifier_map).map(localID => ({
      id: `${serverURL}|${localID}`,
      serverURL,
      localID,
      serverID: serverPatchObj.identifier_map[localID]
    }));

    return db.transaction('rw', db.idMap, db.localPatches, () => {
      db.localPatches.update(localPatchID, { resolved: true, merged: true });
      identifiers.forEach(obj => db.idMap.put(obj));
    });
  }

  this.markSubmittedPatchNotMerged = function (localPatchID) {
    return require('./db')(this.name).localPatches.update(localPatchID, {
      resolved: true,
      merged: false
    });
  }

  this.getSubmittedPatch = function (id) {
    return require('./db')(this.name).localPatches.get(id);
  }


  this.getSubmittedPatches = function () {
    return require('./db')(this.name).localPatches.toArray()
  }

  this.getMappedIDs = function (serverURL) {
    return require('./db')(this.name).idMap
      .where('serverURL').equals(serverURL)
      .toArray()
      .then(Immutable.fromJS)
      .then(replacements => replacements
        .toMap()
        .mapEntries(([key, val]) => [val.get('serverID'), val.get('localID')])
      )
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
      .then(function ([data, , xhr]) {
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
 * File backend
 ***********************************************************/
function FileBackend(opts) {
  Backend.call(this, opts);
  this.type = 'file';

  this.fetchData = function () {
    return require('./file_backends')
      .getFile(this.name.slice(5)) // Strip file: prefix
      .then(fileObj => {
        this._fileObj = fileObj;
        return { data: fileObj.data }
      });
  }
}
FileBackend.constructor = FileBackend;
FileBackend.prototype = Object.create(Backend.prototype);



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
      return dexieDBs
        .filter(db => db !== '_linked_data_cache' && db !== '_file_backends' )
        .map(db => ({ type: 'idb', name: db }))
    });

    dbPromise = dbPromise.then(idbBackends => {
      return require('./file_backends')
        .listFiles()
        .then(files => files.map(name => ({ type: 'file', name: 'file:' + name })))
        .then(files => idbBackends.concat(files))
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
        memory: MemoryBackend,
        file: FileBackend
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
    //require('./app').trigger('backendSwitch', backend);
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
      } else if (opts.type === 'file') {
        // Name of DB will be different from filename itself
        dbOpen = require('./file_backends')
          .addFile(opts.name, opts.data)
          .then(({ name }) => { opts.name = 'file:' + name })
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
