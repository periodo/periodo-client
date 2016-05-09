"use strict";

const Dexie = require('dexie')
    , jsonpatch = require('fast-json-patch')
    , patchUtils = require('./utils/patch')

const DUMP_ID = 1;

const openDatabases = new Map();

function openDB(dbName) {
  const db = new Dexie(dbName)

  db.version(10).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affectedCollections,*affectedPeriods,*forwardHashes,*backwardHashes,type',
    localPatches: 'id&,resolved',
    idMap: 'id&,serverURL,localID'
  });

  // Create an initial, empty dataset.
  db.on('populate', () => {
    db.localData.put({
      id: DUMP_ID,
      data: { periodCollections: {}, type: 'rdf:Bag' },
      modified: new Date().getTime()
    });
  });

  db.open();

  return Object.assign(db, {
    getlocalData() {
      return db.getLocalData.get(DUMP_ID);
    },

    // Update the local data to given state. This will generate forwards and
    // backwards patches as well as their hashes (to be matched against later
    // when detecting changes.)
    updateLocalData(newData, message) {
      return db.transaction('rw', db.localData, db.patches, () => {
        return db.getLocalData().then(oldData => {
          const patchData = patchUtils.formatPatch(oldData.data, newData, message)
              , localData = { id: DUMP_ID, data: newData, modified: new Date().getTime() }

          const promises = [
            db.patches.put(patchData),
            db.localData.put(localData),
          ]

          return Dexie.Promise.all(promises).then(() => newData)
        });
      });
    },

    updateDumpData(newValue) {
      newValue.id = DUMP_ID;
      return db.dumps.put(newValue);
    },
  });
}

module.exports = function (dbName) {
  if (!openDatabases.has(dbName)) {
    openDatabases.set(dbName, openDB(dbName));
  }

  return openDatabases.get(dbName);
}
