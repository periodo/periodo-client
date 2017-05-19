"use strict";

const Dexie = require('dexie')
    , openDatabases = {}

const { INDEXED_DB } = require('../types').backends

function migrateLegacyDB(name, dexieOpts) {
  return new Dexie.Promise((resolve, reject) => {
    Dexie.exists(name).then(exists => {
      if (!exists) {
        reject(`Cannot migrate ${name}: no such database`);
      }

      const request = indexedDB.open(name);

      request.onerror = reject;
      request.onsuccess = e => {
        const db = e.target.result
            , objectStoreNames = [...db.objectStoreNames]

        const isLegacyIDB = (
          objectStoreNames.indexOf('localData') !== -1 &&
          objectStoreNames.indexOf('patches') !== -1
        )

        if (!isLegacyIDB) {
          throw new Error(`Cannot migrate ${name}: not a legacy IDB`);
        }

        resolve(migrateLegacyIDBBackend(name, dexieOpts));
      }
    });
  });
}

function migrateLegacyIDBBackend(name, dexieOpts) {
  const periodoDB = require('./periodo')(dexieOpts)
      , legacyDB = openLegacyDB(name, dexieOpts)

  return periodoDB.transaction(
    'rw',
    periodoDB.localDatasets,
    periodoDB.localDatasetPatches,
    () => {
      legacyDB.transaction('r', legacyDB.localData, legacyDB.patches, () => {
        legacyDB.localData.get(1, ({ data, modified }) => {
          periodoDB.backends.add({
            name,
            type: INDEXED_DB,
            created: null,
            modified
          });

          periodoDB.localDatasets.add({
            name,
            data,
            modified,
          });
        })

        legacyDB.patches.toArray(patches => {
          patches.forEach(patch => {
            periodoDB.localDatasetPatches.put(Object.assign({}, patch, { name }));
          });
        });
      })
    })

}

function migrateLegacyFileBackend() {
}

function openLegacyDB(name, dexieOpts) {
  if (!openDatabases.hasOwnProperty(name)) {
    const db = new Dexie(name, dexieOpts)

    switch (name) {
      case '_file_backends':
        db.version(1).stores({
          files: 'id++,&name,filename'
        });
        break;

      default:
        db.version(10).stores({
          dumps: 'id&,modified,synced',
          localData: 'id&,modified',
          patches: 'id++,created,*affectedCollections,*affectedPeriods,*forwardHashes,*backwardHashes,type',
          localPatches: 'id&,resolved',
          idMap: 'id&,serverURL,localID'
        });
        break;

    }

    openDatabases[name] = db;
  }
}

module.exports = { migrateLegacyDB, migrateLegacyFileBackend }
