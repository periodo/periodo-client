"use strict";

var Dexie = require('Dexie')
  , patchUtils = require('./utils/patch')
  , db

var DUMPID = 1;

module.exports = db = new Dexie('periodo-client');

db.version(1).stores({
  dumps: 'id&,modified,synced',
  localData: 'id&,modified',
  patches: 'id++,created,*affected'
});

db.on('populate', function () {
  // Create an initial, empty dataset.
  db.localData.put({
    id: DUMPID,
    data: { periodCollections: {} },
    modified: new Date().getTime()
  });
});

db.getLocalData = function () { return db.localData.get(DUMPID) }

/* Generates a patch that will transform the stored local data to `newData` */
db.makeLocalPatch = function (newData) {
  return db.getLocalData().then(function (oldData) {
    var forward = patchUtils.makePatch(oldData.data, newData)
      , backward = patchUtils.makePatch(newData, oldData.data)

    return {
      forward: forward,
      backward: backward,
      affected: patchUtils.getAffectedPeriodizations(forward, backward)
    }
  });
}

db.updateLocalData = function (newData, message) {
  return db.transaction('rw', db.localData, db.patches, function () {
    return db.makeLocalPatch(newData).then(function (patches) {
      var promises = []
        , localData
        , patchData

      localData = {
        id: DUMPID,
        data: newData,
        modified: new Date().getTime()
      }

      patchData = {
        forward: patches.forward,
        backward: patches.backward,
        created: new Date().getTime(),
        message: message,
        affected: patches.affected
      }

      promises.push(db.localData.put(localData));
      promises.push(db.patches.put(patchData));

      return Dexie.Promise.all(promises).then(Dexie.Promise.resolve({
        localData: localData,
        patches: patchData
      }));
    });
  });
}


db.updateDumpData = function (newValue) {
  newValue.id = DUMPID;
  return db.dumps.put(newValue);
}

db.open();
